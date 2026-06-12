import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/ui/AdminTable";
import ConfirmModal from "../../components/admin/ui/ConfirmModal";
import { Pagination } from "../../components/shared";
import {
  useDeleteTransformationStory,
  useAdminTransformationStories,
  useTogglePublishTransformationStory,
} from "../../hooks/useTransformationStory";
import { useDebounce } from "../../hooks/useDebounce";

const PAGE_SIZE = 10;

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "-";

const getDeleteCopy = (story) => ({
  title: "Delete transformation story",
  message: story
    ? `Are you sure you want to delete "${story.title}"? This action cannot be undone.`
    : "Are you sure you want to delete this transformation story? This action cannot be undone.",
  confirmLabel: "Delete",
  danger: true,
});

const getImageUrl = (story) =>
  story.coverImage?.url ||
  story.afterImage?.url ||
  story.beforeImage?.url ||
  "";

export default function TransformationStoriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModal, setDeleteModal] = useState({ open: false, story: null });
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchInput, 300);

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const page = Math.max(Number(searchParams.get("page") || 1), 1);

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status && status !== "all" ? status : undefined, // ✅ FIX: Don't pass 'all' to API
    }),
    [page, search, status],
  );

  const { data, isLoading, isError, error, refetch } =
    useAdminTransformationStories(filters);
  const deleteStory = useDeleteTransformationStory();
  const togglePublishStory = useTogglePublishTransformationStory();

  const stories = data?.data || [];
  const meta = data?.meta || {
    currentPage: page,
    totalPages: 1,
    totalCount: 0,
    limit: PAGE_SIZE,
  };

  const updateParams = (updater) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        updater(next);
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (debouncedSearch === search) return;
    updateParams((next) => {
      if (debouncedSearch) next.set("search", debouncedSearch);
      else next.delete("search");
      next.set("page", "1");
    });
  }, [debouncedSearch, search]);

  const handleStatusChange = (value) => {
    updateParams((next) => {
      if (value === "all") next.delete("status");
      else next.set("status", value);
      next.set("page", "1");
    });
  };

  const handlePageChange = (nextPage) => {
    updateParams((next) => {
      next.set("page", String(nextPage));
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteModal = (story) => setDeleteModal({ open: true, story });
  const closeDeleteModal = () => setDeleteModal({ open: false, story: null });

  const handleDelete = async () => {
    if (!deleteModal.story) return;
    await deleteStory.mutateAsync(deleteModal.story.id);
    closeDeleteModal();
  };

  const handleTogglePublish = async (story) => {
    await togglePublishStory.mutateAsync(story.id);
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        label: "Story",
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <div className="h-14 w-20 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[#171A25]">
              {getImageUrl(row) ? (
                <img
                  src={getImageUrl(row)}
                  alt={row.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--admin-muted)]">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">{row.title}</div>
              <div
                className="mt-1 line-clamp-2 text-xs"
                style={{ color: "var(--admin-muted)" }}
              >
                {row.excerpt || "No excerpt available."}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "customerName",
        label: "Customer",
        width: 150,
        render: (value) => <span>{value || "-"}</span>,
      },
      {
        key: "category",
        label: "Category",
        width: 150,
        render: (value) => (
          <span style={{ color: "var(--admin-muted)" }}>{value || "-"}</span>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: 120,
        render: (_, row) => (
          <span
            className={`admin-badge ${row.status === "published" ? "admin-badge-success" : "admin-badge-warning"}`}
          >
            {row.status === "published" ? "Published" : "Draft"}
          </span>
        ),
      },
      {
        key: "publishedAt",
        label: "Published",
        width: 140,
        render: (value, row) => formatDate(value || row.createdAt),
      },
      {
        key: "actions",
        label: "Actions",
        width: 140,
        render: (_, row) => (
          <div
            className="flex items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="admin-button admin-icon-button"
              type="button"
              title="Edit"
              onClick={() => navigate(`/admin/transformations/${row.id}/edit`)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title={row.status === "published" ? "Unpublish" : "Publish"}
              onClick={() => handleTogglePublish(row)}
            >
              {row.status === "published" ? (
                <EyeOff size={15} />
              ) : (
                <Eye size={15} />
              )}
            </button>
            <button
              className="admin-button admin-icon-button"
              type="button"
              title="Delete"
              onClick={() => openDeleteModal(row)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [navigate, togglePublishStory],
  );

  return (
    <AdminLayout
      title="Transformation Stories"
      breadcrumb="Transformation Stories"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Transformation Stories</h2>
          <span
            className="admin-badge"
            style={{
              background: "#24283A",
              borderColor: "var(--admin-border)",
              color: "var(--admin-muted)",
            }}
          >
            {meta.totalCount || 0} total
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            className="admin-input w-[260px]"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search stories, customers, categories..."
          />
          <button
            className="admin-button admin-button-primary"
            type="button"
            onClick={() => navigate("/admin/transformations/new")}
          >
            <Plus size={16} />
            New Story
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "published", label: "Published" },
          { value: "draft", label: "Draft" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleStatusChange(option.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              status === option.value
                ? "border-[var(--admin-accent)] bg-[#24283A] text-[var(--admin-text)]"
                : "border-[var(--admin-border)] bg-[#171A25] text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="admin-card p-6 mb-4">
          <div className="text-lg font-semibold">
            Unable to load transformation stories
          </div>
          <div className="mt-2 text-sm" style={{ color: "var(--admin-muted)" }}>
            {error?.response?.data?.message ||
              error?.message ||
              "An unexpected error occurred."}
          </div>
          <button
            className="admin-button admin-button-primary mt-4"
            type="button"
            onClick={() => refetch()}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      <AdminTable
        columns={columns}
        data={stories}
        loading={isLoading}
        emptyMessage="No transformation stories found"
      />

      {!isError && stories.length > 0 && meta.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={meta.currentPage || page}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title={getDeleteCopy(deleteModal.story).title}
        message={getDeleteCopy(deleteModal.story).message}
        confirmLabel={getDeleteCopy(deleteModal.story).confirmLabel}
        danger={getDeleteCopy(deleteModal.story).danger}
        isLoading={deleteStory.isPending}
      />
    </AdminLayout>
  );
}

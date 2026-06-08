import { Link, useSearchParams } from 'react-router-dom';
import { Clock3, RefreshCw, Tag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { Pagination, SearchBar } from '../../components/shared';
import { BLOG_CATEGORIES } from '../../services/blogApi';
import { useBlogs } from '../../hooks/useBlogs';

const PAGE_SIZE = 9;

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'H';

function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden border border-black/10 bg-white shadow-sm">
      <div className="aspect-[4/3] bg-gradient-to-br from-[#f2e6d8] via-[#ece2d4] to-[#f7f0ea]">
        <div className="h-full w-full animate-pulse bg-black/5" />
      </div>
      <div className="space-y-3 p-5">
        <div className="h-4 w-24 animate-pulse bg-black/10" />
        <div className="h-6 w-11/12 animate-pulse bg-black/10" />
        <div className="h-4 w-full animate-pulse bg-black/10" />
        <div className="h-4 w-5/6 animate-pulse bg-black/10" />
        <div className="flex items-center gap-3 pt-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-black/10" />
          <div className="h-4 w-28 animate-pulse bg-black/10" />
        </div>
      </div>
    </div>
  );
}

function BlogCard({ blog }) {
  return (
    <article className="group overflow-hidden border border-black/10 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/blog/${blog.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(160deg,#f7ede2_0%,#f3e0cf_48%,#faf7f2_100%)]">
          {blog.coverImage ? (
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-white/70">
                <Tag size={20} className="text-black/35" />
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-black/35">Homa Blog</span>
            </div>
          )}
        </div>

        <div className="space-y-4 p-5">
          <span className="inline-flex w-fit rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
            {blog.category}
          </span>

          <h2 className="font-display text-2xl leading-tight text-black transition-colors group-hover:text-red-600">
            {blog.title}
          </h2>

          <p className="line-clamp-3 text-sm leading-6 text-black/65">
            {blog.excerpt}
          </p>

          <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm text-black/60">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/5 text-xs font-semibold text-black">
                {blog.author?.avatar ? (
                  <img src={blog.author.avatar} alt={blog.author.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(blog.author?.name)
                )}
              </div>
              <span className="truncate">{blog.author?.name || 'Homa'}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap">{formatDate(blog.publishedAt || blog.createdAt)}</span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock3 size={14} />
                {blog.readTimeMinutes || 1} min read
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const page = Math.max(Number(searchParams.get('page') || 1), 1);

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      category: category === 'all' ? undefined : category,
    }),
    [category, page, search],
  );

  const { data, isLoading, isError, error, refetch } = useBlogs(filters);

  const blogs = data?.data || [];
  const meta = data?.meta || {
    currentPage: page,
    totalPages: 1,
    totalCount: 0,
    limit: PAGE_SIZE,
  };

  const updateParams = (updater) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      updater(next);
      return next;
    }, { replace: true });
  };

  const handleSearchChange = (value) => {
    updateParams((next) => {
      if (value) next.set('search', value);
      else next.delete('search');
      next.set('page', '1');
    });
  };

  const handleCategoryChange = (value) => {
    updateParams((next) => {
      if (value === 'all') next.delete('category');
      else next.set('category', value);
      next.set('page', '1');
    });
  };

  const handlePageChange = (nextPage) => {
    updateParams((next) => {
      next.set('page', String(nextPage));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFiltersHref = '/blog';
  const hasActiveFilters = Boolean(search || category !== 'all');

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>Blog | Homa</title>
        <meta
          name="description"
          content="Read beauty insights, skincare tips, and product stories from Homa."
        />
      </Helmet>

      <section className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">Homa Journal</p>
          <h1 className="mt-4 font-display text-5xl leading-tight text-black md:text-7xl">
            Our Blog
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-black/65 md:text-lg">
            Notes, guides, and product stories for a calmer routine and better skin.
          </p>

          <div className="mt-8 max-w-2xl">
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search articles..."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', ...BLOG_CATEGORIES].map((item) => {
            const active = item === category;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleCategoryChange(item)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-white/70 text-black hover:border-black/25 hover:bg-white'
                }`}
              >
                {item === 'all' ? 'All' : item}
              </button>
            );
          })}
        </div>

        {isError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">
                {error?.response?.data?.message || error?.message || 'Something went wrong while loading the blog.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/90"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          </div>
        )}

        {!isError && isLoading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <BlogCardSkeleton key={`blog-skeleton-${index}`} />
            ))}
          </div>
        )}

        {!isError && !isLoading && blogs.length === 0 && (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[2rem] border border-black/10 bg-white/80 px-6 py-16 text-center shadow-sm">
            <h2 className="font-display text-3xl text-black">No articles found</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-black/65">
              Try a different search term or category.
            </p>
            {hasActiveFilters && (
              <Link
                to={clearFiltersHref}
                replace
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4 transition-colors hover:text-red-600"
              >
                Clear filters
              </Link>
            )}
          </div>
        )}

        {!isError && blogs.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>

            {meta.totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination
                  currentPage={meta.currentPage || page}
                  totalPages={meta.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

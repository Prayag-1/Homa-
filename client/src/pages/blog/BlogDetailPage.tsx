import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { useBlog, useBlogs } from '../../hooks/useBlogs';

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

const isHtmlContent = (content = '') => /<\/?[a-z][\s\S]*>/i.test(content);

function renderMarkdownLike(content = '') {
  const lines = content.split('\n');
  const nodes = [];
  let paragraph = [];
  let listItems = [];

  const flushParagraph = (index) => {
    if (paragraph.length === 0) return;
    nodes.push(
      <p key={`p-${index}-${nodes.length}`} className="text-[17px] leading-8 text-black/78 whitespace-pre-wrap">
        {paragraph.join('\n')}
      </p>,
    );
    paragraph = [];
  };

  const flushList = (index) => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${index}-${nodes.length}`} className="space-y-2 pl-5">
        {listItems.map((item, itemIndex) => (
          <li key={`li-${index}-${itemIndex}`} className="list-disc text-[17px] leading-8 text-black/78">
            {item}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(index);
      flushList(index);
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph(index);
      flushList(index);
      nodes.push(<h4 key={`h4-${index}`} className="mt-5 font-display text-2xl text-black">{trimmed.replace(/^###\s+/, '')}</h4>);
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph(index);
      flushList(index);
      nodes.push(<h3 key={`h3-${index}`} className="mt-6 font-display text-3xl text-black">{trimmed.replace(/^##\s+/, '')}</h3>);
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph(index);
      flushList(index);
      nodes.push(<h2 key={`h2-${index}`} className="mt-7 font-display text-4xl text-black">{trimmed.replace(/^#\s+/, '')}</h2>);
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph(index);
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }

    flushList(index);
    paragraph.push(line);
  });

  flushParagraph(lines.length);
  flushList(lines.length);
  return nodes;
}

function BlogMeta({ blog }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-y border-black/10 py-4 text-sm text-black/65">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/5 text-xs font-semibold text-black">
          {blog.author?.avatar ? (
            <img
              src={blog.author.avatar}
              alt={blog.author.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            getInitials(blog.author?.name)
          )}
        </div>
        <span className="font-medium text-black">{blog.author?.name || 'Homa'}</span>
      </div>

      <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
      <span className="flex items-center gap-1">
        <Clock3 size={14} />
        {blog.readTimeMinutes || 1} min read
      </span>
    </div>
  );
}

function RelatedArticles({ currentBlog }) {
  const relatedQuery = useBlogs({
    limit: 4,
    category: currentBlog.category,
  });

  const related = useMemo(
    () =>
      (relatedQuery.data?.data || [])
        .filter((item) => item.slug !== currentBlog.slug)
        .slice(0, 3),
    [currentBlog.slug, relatedQuery.data?.data],
  );

  if (!currentBlog.category || related.length === 0) return null;

  return (
    <section className="mt-16 border-t border-black/10 pt-12">
      <h2 className="font-display text-3xl text-black">Related articles</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {related.map((item) => (
          <Link
            key={item.id}
            to={`/blog/${item.slug}`}
            className="group overflow-hidden border border-black/10 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="aspect-[4/3] bg-[linear-gradient(160deg,#f7ede2_0%,#f3e0cf_48%,#faf7f2_100%)]">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </div>
            <div className="space-y-3 p-4">
              <span className="inline-flex rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                {item.category}
              </span>
              <h3 className="font-display text-xl leading-tight text-black group-hover:text-red-600">
                {item.title}
              </h3>
              <p className="line-clamp-2 text-sm leading-6 text-black/65">{item.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { data: blog, isLoading, isError, error, refetch } = useBlog(slug);

  const notFound = isError || !blog || blog.status !== 'published';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>{blog?.title ? `${blog.title} | Blog` : 'Blog | Homa'}</title>
      </Helmet>

      <section className="mx-auto max-w-[720px] px-4 py-10 md:py-14">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-black/70 transition-colors hover:text-black"
        >
          <ArrowLeft size={15} />
          Back to Blog
        </Link>

        {isLoading && (
          <div className="mt-8 space-y-4">
            <div className="aspect-[16/9] animate-pulse bg-black/10" />
            <div className="h-4 w-28 animate-pulse bg-black/10" />
            <div className="h-14 w-full animate-pulse bg-black/10" />
            <div className="h-6 w-2/3 animate-pulse bg-black/10" />
          </div>
        )}

        {notFound && !isLoading && (
          <div className="mt-10 rounded-[2rem] border border-black/10 bg-white/80 p-8 text-center shadow-sm">
            <h1 className="font-display text-5xl text-black">404</h1>
            <p className="mt-4 text-lg text-black/65">
              {error?.response?.status === 404 || !blog
                ? 'This article could not be found.'
                : 'This article is not available right now.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/blog"
                className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/90"
              >
                Return to Blog
              </Link>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-black/5"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoading && blog && blog.status === 'published' && (
          <>
            <article className="mt-8">
              <div className="aspect-[16/9] overflow-hidden border border-black/10 bg-[linear-gradient(160deg,#f7ede2_0%,#f3e0cf_48%,#faf7f2_100%)]">
                {blog.coverImage ? (
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                ) : null}
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                    {blog.category}
                  </span>
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <h1 className="font-display text-5xl leading-tight text-black md:text-6xl">
                  {blog.title}
                </h1>

                <BlogMeta blog={blog} />

                <div className="space-y-6 pt-2">
                  {isHtmlContent(blog.content) ? (
                    <div
                      className="space-y-5 text-[17px] leading-8 text-black/78"
                      // Admin-authored CMS HTML content.
                      dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                  ) : (
                    <div className="space-y-5">{renderMarkdownLike(blog.content)}</div>
                  )}
                </div>
              </div>
            </article>

            <div className="mt-14 border-t border-black/10 pt-8">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-black/70 transition-colors hover:text-black"
              >
                <ArrowLeft size={15} />
                Back to Blog
              </Link>
            </div>

            <RelatedArticles currentBlog={blog} />
          </>
        )}
      </section>
    </main>
  );
}

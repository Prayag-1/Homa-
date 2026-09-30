import { Clock3, Layers3, ArrowLeft, RefreshCw, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useRelatedTransformationStories, useTransformationStory } from '../../hooks/useTransformationStory';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    : '';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'H';

const isHtmlContent = (content = '') => /<([a-z][\s\S]*?)>/i.test(content.trim());

const renderMarkdownLike = (content = '') =>
  content
    .split(/\n{2,}/)
    .map((chunk, index) => {
      const trimmed = chunk.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={`block-${index}`} className="text-2xl font-semibold text-black">
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={`block-${index}`} className="text-3xl font-semibold text-black">
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
      }

      return (
        <p key={`block-${index}`} className="text-base leading-8 text-black/75">
          {trimmed}
        </p>
      );
    });

function StoryMeta({ story }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-black/60">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/5 text-xs font-semibold text-black">
          {story.author?.avatar ? (
            <img
              src={story.author.avatar}
              alt={story.author.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            getInitials(story.author?.name)
          )}
        </div>
        <div>
          <div className="font-medium text-black">{story.customerName || story.author?.name || 'Verified customer'}</div>
          <div className="text-xs uppercase tracking-[0.22em] text-black/40">Shared by Homa</div>
        </div>
      </div>

      <span className="flex items-center gap-1">
        <Clock3 size={14} />
        {story.readTimeMinutes || 1} min read
      </span>

      <span>{formatDate(story.publishedAt || story.createdAt)}</span>
    </div>
  );
}

function RelatedStories({ currentSlug }: { currentSlug: string }) {
  const { data: related = [], isLoading } = useRelatedTransformationStories(currentSlug);

  if (isLoading) {
    return (
      <section className="mt-14">
        <div className="mb-5 h-6 w-44 animate-pulse bg-black/10" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`related-skeleton-${index}`} className="h-64 animate-pulse border border-black/10 bg-white/70" />
          ))}
        </div>
      </section>
    );
  }

  if (!related.length) return null;

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-semibold text-black">Related articles</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {related.map((story) => (
          <Link
            key={story.id}
            to={`/transformations/${story.slug}`}
            className="group overflow-hidden border border-black/10 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="aspect-[4/3] overflow-hidden bg-[linear-gradient(160deg,#f7ede2_0%,#f3e0cf_48%,#faf7f2_100%)]">
              {story.coverImage?.url || story.afterImage?.url || story.beforeImage?.url ? (
                <img
                  src={story.coverImage?.url || story.afterImage?.url || story.beforeImage?.url || ''}
                  alt={story.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-black/40">{story.category}</p>
              <h3 className="text-xl font-semibold text-black transition-colors group-hover:text-red-600">{story.title}</h3>
              <p className="line-clamp-3 text-sm leading-6 text-black/65">{story.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function TransformationDetailPage() {
  const { slug } = useParams();
  const { data: story, isLoading, isError, error, refetch } = useTransformationStory(slug);
  const notFound = isError || !story || story.status !== 'published';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#f7efe7_42%,#fffdf9_100%)]">
      <Helmet>
        <title>{story?.title ? `${story.title} | Transformation Stories` : 'Transformation Stories | Homa'}</title>
        <meta
          name="description"
          content={story?.excerpt || 'Real skincare transformation stories from Homa customers.'}
        />
      </Helmet>

      <section className="mx-auto max-w-[720px] px-4 py-10 md:py-14">
        <div className="mb-8">
          <Link
            to="/transformations"
            className="inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4 transition-colors hover:text-red-600"
          >
            <ArrowLeft size={15} />
            Back to Stories
          </Link>
        </div>

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">
                {error?.response?.data?.message || error?.message || 'Something went wrong while loading the story.'}
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

        {!isLoading && notFound && (
          <div className="rounded-[2rem] border border-black/10 bg-white/80 px-6 py-16 text-center shadow-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-black/45">Not found</p>
            <h1 className="mt-4 font-display text-4xl text-black">Transformation story not found</h1>
            <p className="mt-3 text-sm leading-7 text-black/65">
              The story may have been removed or is not published yet.
            </p>
            <Link
              to="/transformations"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4"
            >
              Back to stories
            </Link>
          </div>
        )}

        {!isLoading && story && story.status === 'published' && (
          <article className="space-y-8">
            <header className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
                <div className="aspect-[16/9] bg-[linear-gradient(160deg,#f7ede2_0%,#f3e0cf_48%,#faf7f2_100%)]">
                  {story.coverImage?.url || story.afterImage?.url || story.beforeImage?.url ? (
                    <img
                      src={story.coverImage?.url || story.afterImage?.url || story.beforeImage?.url || ''}
                      alt={story.title}
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex w-fit rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                    {story.category}
                  </span>
                  {story.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex w-fit rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/55"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="font-display text-5xl leading-tight text-black md:text-6xl">
                  {story.title}
                </h1>

                <StoryMeta story={story} />
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-sm">
                <div className="border-b border-black/10 px-5 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-black/50">
                    <User size={15} />
                    Before
                  </div>
                </div>
                <div className="aspect-[4/5] bg-[linear-gradient(160deg,#f7ede2_0%,#f3e0cf_48%,#faf7f2_100%)]">
                  {story.beforeImage?.url ? (
                    <img
                      src={story.beforeImage.url}
                      alt={`${story.title} before`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-sm">
                <div className="border-b border-black/10 px-5 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-black/50">
                    <Layers3 size={15} />
                    After
                  </div>
                </div>
                <div className="aspect-[4/5] bg-[linear-gradient(160deg,#f7ede2_0%,#f3e0cf_48%,#faf7f2_100%)]">
                  {story.afterImage?.url ? (
                    <img
                      src={story.afterImage.url}
                      alt={`${story.title} after`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/10 bg-white/85 px-6 py-8 shadow-sm md:px-8">
              <div className="space-y-5">
                {isHtmlContent(story.content) ? (
                  <div
                    className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-black/75 prose-a:text-black"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.content) }}
                  />
                ) : (
                  <div className="space-y-5">{renderMarkdownLike(story.content)}</div>
                )}
              </div>
            </section>

            <RelatedStories currentSlug={story.slug} />

            <div className="pt-4">
              <Link
                to="/transformations"
                className="inline-flex items-center gap-2 text-sm font-medium text-black underline underline-offset-4 transition-colors hover:text-red-600"
              >
                <ArrowLeft size={15} />
                Back to Stories
              </Link>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}

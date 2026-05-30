// Mock next/navigation for Jest tests
const noop = () => {}

module.exports = {
  useRouter: () => ({
    push: noop,
    replace: noop,
    prefetch: noop,
    back: noop,
    forward: noop,
    refresh: noop,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: (url) => { throw new Error(`redirect: ${url}`) },
  notFound: () => { throw new Error('notFound') },
  RedirectType: { push: 'push', replace: 'replace' },
}

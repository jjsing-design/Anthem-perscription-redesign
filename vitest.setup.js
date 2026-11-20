// jsdom does not implement window.scrollTo, which App calls on route changes.
window.scrollTo = () => {};

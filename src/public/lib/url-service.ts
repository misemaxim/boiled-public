export const urlService = {
  change: (url: string, force = false): void => {
    if (urlService.isExternal(url)) {
      window.open(url);
      return;
    }

    if (force) {
      window.open(url, '_self');
      return;
    }

    window.history.pushState(null, url, url);
    window.dispatchEvent(new Event('popstate'));
  },
  set: (url: string): void => {
    window.history.pushState(null, url, url);
  },
  isExternal: (link: string) => {
    const external = !link.startsWith('/') && !link.startsWith(location.origin);

    return external;
  },
  handler: (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();

    urlService.change(event.currentTarget.href);

    if (!urlService.isExternal(event.currentTarget.href)) {
      const sidePanel = event.currentTarget.closest('.sidenav');
      if (sidePanel) {
        M.Sidenav.getInstance(sidePanel).close();
      }

      const modal = event.currentTarget.closest('.modal');
      if (modal) {
        M.Modal.getInstance(modal).close();
      }
    }
  }
};

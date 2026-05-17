export const getMinZoom = (containerId: string) => {
  const viewport = document.getElementById(containerId) as HTMLDivElement;
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;

  return {
    byWidth: Math.ceil(Math.LOG2E * Math.log(width / 256)),
    byHeight: Math.ceil(Math.LOG2E * Math.log(height / 256))
  };
};

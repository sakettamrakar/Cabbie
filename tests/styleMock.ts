const styles: Record<string, string> = new Proxy(
  {},
  {
    get: (_, property: string) => property,
  },
);

export default styles;

interface JsonLdProps { data: any; }
export const JsonLd = ({ data }:JsonLdProps) => {
  if(!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
};
export default JsonLd;

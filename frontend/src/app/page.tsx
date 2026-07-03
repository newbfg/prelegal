import NdaApp from "@/components/NdaApp";
import { readMutualNdaTemplates } from "@/lib/templates";

export default function Home() {
  const { coverPage, standardTerms } = readMutualNdaTemplates();

  return (
    <NdaApp coverPageTemplate={coverPage} standardTermsTemplate={standardTerms} />
  );
}

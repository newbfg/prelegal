import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// remark-gfm/remark-rehype only emit a `checked` attribute for *checked* task-list
// boxes (standard HTML boolean-attribute convention), so unchecked boxes get no
// `checked` prop at all. React then treats that box as uncontrolled and stops
// updating its DOM state on re-render — after toggling the MNDA/confidentiality
// term, both the old and new choice could end up visually checked at once.
// Explicitly coercing to a boolean keeps every checkbox controlled.
const components: Components = {
  input: (props) => {
    const { node, checked, ...rest } = props;
    void node;
    return <input {...rest} type="checkbox" checked={Boolean(checked)} readOnly />;
  },
};

export default function NdaDocument({
  coverPage,
  standardTerms,
}: {
  coverPage: string;
  standardTerms: string;
}) {
  return (
    <div className="nda-document">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {coverPage}
      </ReactMarkdown>
      <hr className="nda-document-divider" />
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {standardTerms}
      </ReactMarkdown>
    </div>
  );
}

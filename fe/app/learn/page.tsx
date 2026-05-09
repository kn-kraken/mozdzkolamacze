import Markdown from "react-markdown";

const content = `
# Welcome to Learn

This is a **markdown** viewer.
`;

export default function LearnPage() {
  return (
    <article className="prose max-w-3xl mx-auto p-8">
      <Markdown>{content}</Markdown>
    </article>
  );
}

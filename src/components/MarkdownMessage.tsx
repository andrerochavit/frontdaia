import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
export default function MarkdownMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <div className="markdown-body text-sm leading-relaxed">
      {isStreaming ? (
        //  TEXTO PURO DURANTE STREAM
        <div className="whitespace-pre-wrap">{content}</div>
      ) : (
        //  MARKDOWN FINAL
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold mt-3 mb-1.5 text-foreground">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-bold mt-2.5 mb-1 text-foreground">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-2 last:mb-0">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside pl-5 mb-2 space-y-0.5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside pl-5 mb-2 space-y-0.5">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/40 pl-3 my-2 text-muted-foreground italic">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-3 border-muted" />,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                {children}
              </a>
            ),
            code({ inline, className, children, ...props }: {
              inline?: boolean;
              className?: string;
              children: React.ReactNode;
            }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg text-xs my-2"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code
                  className="bg-primary/10 text-primary px-1 py-0.5 rounded text-[0.82em] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
}
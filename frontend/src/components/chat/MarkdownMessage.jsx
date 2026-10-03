const urlPattern =
    /^https?:\/\//i;

const renderInline =
    (text = '', keyPrefix = 'inline') => {

        const nodes = [];
        let index = 0;

        const pushText =
            (value) => {
                if (!value) {
                    return;
                }

                nodes.push(
                    <span key={`${keyPrefix}-text-${nodes.length}`}>
                        {value}
                    </span>
                );
            };

        while (index < text.length) {
            const rest = text.slice(index);

            const linkMatch =
                rest.match(/^\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/);
            if (linkMatch) {
                nodes.push(
                    <a
                        key={`${keyPrefix}-link-${nodes.length}`}
                        href={linkMatch[2]}
                        target="_blank"
                        rel="noreferrer"
                        className="markdown-link"
                    >
                        {linkMatch[1]}
                    </a>
                );
                index += linkMatch[0].length;
                continue;
            }

            const codeMatch =
                rest.match(/^`([^`]+)`/);
            if (codeMatch) {
                nodes.push(
                    <code
                        key={`${keyPrefix}-code-${nodes.length}`}
                        className="markdown-inline-code"
                    >
                        {codeMatch[1]}
                    </code>
                );
                index += codeMatch[0].length;
                continue;
            }

            const boldMatch =
                rest.match(/^\*\*([^*]+)\*\*/);
            if (boldMatch) {
                nodes.push(
                    <strong key={`${keyPrefix}-bold-${nodes.length}`}>
                        {renderInline(boldMatch[1], `${keyPrefix}-bold-${nodes.length}`)}
                    </strong>
                );
                index += boldMatch[0].length;
                continue;
            }

            const italicMatch =
                rest.match(/^\*([^*\n]+)\*/);
            if (italicMatch) {
                nodes.push(
                    <em key={`${keyPrefix}-italic-${nodes.length}`}>
                        {renderInline(italicMatch[1], `${keyPrefix}-italic-${nodes.length}`)}
                    </em>
                );
                index += italicMatch[0].length;
                continue;
            }

            const mentionMatch =
                rest.match(/^@[^\s]+/);
            if (mentionMatch) {
                nodes.push(
                    <span
                        key={`${keyPrefix}-mention-${nodes.length}`}
                        className="mention-token"
                    >
                        {mentionMatch[0]}
                    </span>
                );
                index += mentionMatch[0].length;
                continue;
            }

            const autoLinkMatch =
                rest.match(/^https?:\/\/[^\s]+/);
            if (autoLinkMatch && urlPattern.test(autoLinkMatch[0])) {
                nodes.push(
                    <a
                        key={`${keyPrefix}-autolink-${nodes.length}`}
                        href={autoLinkMatch[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="markdown-link"
                    >
                        {autoLinkMatch[0]}
                    </a>
                );
                index += autoLinkMatch[0].length;
                continue;
            }

            const nextSpecial =
                rest.search(/(\[|`|\*\*|\*|@|https?:\/\/)/);

            if (nextSpecial <= 0) {
                pushText(rest.charAt(0));
                index += 1;
            } else {
                pushText(rest.slice(0, nextSpecial));
                index += nextSpecial;
            }
        }

        return nodes;

    };

const readParagraph =
    (lines, startIndex) => {

        const content = [];
        let index = startIndex;

        while (index < lines.length) {
            const line = lines[index];
            const trimmed = line.trim();

            if (
                !trimmed
                || trimmed.startsWith('```')
                || /^#{1,4}\s+/.test(trimmed)
                || /^[-*+]\s+/.test(trimmed)
                || /^\d+\.\s+/.test(trimmed)
                || /^>\s?/.test(trimmed)
            ) {
                break;
            }

            content.push(line);
            index += 1;
        }

        return {
            content,
            nextIndex: index
        };

    };

const MarkdownMessage =
    ({ content = '' }) => {

        const lines =
            String(content).replace(/\r\n/g, '\n').split('\n');
        const blocks = [];
        let index = 0;

        while (index < lines.length) {
            const line = lines[index];
            const trimmed = line.trim();

            if (!trimmed) {
                index += 1;
                continue;
            }

            if (trimmed.startsWith('```')) {
                const language =
                    trimmed.slice(3).trim();
                const codeLines = [];
                index += 1;

                while (index < lines.length && !lines[index].trim().startsWith('```')) {
                    codeLines.push(lines[index]);
                    index += 1;
                }

                if (index < lines.length) {
                    index += 1;
                }

                blocks.push({
                    type: 'code',
                    language,
                    content: codeLines.join('\n')
                });
                continue;
            }

            const headingMatch =
                trimmed.match(/^(#{1,4})\s+(.+)$/);
            if (headingMatch) {
                blocks.push({
                    type: 'heading',
                    level: headingMatch[1].length,
                    content: headingMatch[2]
                });
                index += 1;
                continue;
            }

            if (/^[-*+]\s+/.test(trimmed)) {
                const items = [];

                while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
                    items.push(lines[index].trim().replace(/^[-*+]\s+/, ''));
                    index += 1;
                }

                blocks.push({
                    type: 'ul',
                    items
                });
                continue;
            }

            if (/^\d+\.\s+/.test(trimmed)) {
                const items = [];

                while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
                    items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
                    index += 1;
                }

                blocks.push({
                    type: 'ol',
                    items
                });
                continue;
            }

            if (/^>\s?/.test(trimmed)) {
                const quoteLines = [];

                while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
                    quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
                    index += 1;
                }

                blocks.push({
                    type: 'quote',
                    content: quoteLines.join('\n')
                });
                continue;
            }

            const paragraph =
                readParagraph(lines, index);
            blocks.push({
                type: 'paragraph',
                content: paragraph.content.join('\n')
            });
            index = paragraph.nextIndex;
        }

        return (

            <div className="markdown-message">
                {blocks.map((block, blockIndex) => {
                    if (block.type === 'code') {
                        return (
                            <pre
                                key={`block-${blockIndex}`}
                                className="markdown-code-block"
                            >
                                {block.language && (
                                    <span className="markdown-code-language">
                                        {block.language}
                                    </span>
                                )}
                                <code>{block.content}</code>
                            </pre>
                        );
                    }

                    if (block.type === 'heading') {
                        const HeadingTag =
                            `h${Math.min(block.level + 3, 6)}`;

                        return (
                            <HeadingTag
                                key={`block-${blockIndex}`}
                                className="markdown-heading"
                            >
                                {renderInline(block.content, `block-${blockIndex}`)}
                            </HeadingTag>
                        );
                    }

                    if (block.type === 'ul' || block.type === 'ol') {
                        const ListTag =
                            block.type;

                        return (
                            <ListTag
                                key={`block-${blockIndex}`}
                                className="markdown-list"
                            >
                                {block.items.map((item, itemIndex) => (
                                    <li key={`block-${blockIndex}-item-${itemIndex}`}>
                                        {renderInline(item, `block-${blockIndex}-item-${itemIndex}`)}
                                    </li>
                                ))}
                            </ListTag>
                        );
                    }

                    if (block.type === 'quote') {
                        return (
                            <blockquote
                                key={`block-${blockIndex}`}
                                className="markdown-quote"
                            >
                                {block.content.split('\n').map((part, lineIndex) => (
                                    <span key={`block-${blockIndex}-line-${lineIndex}`}>
                                        {lineIndex > 0 && <br />}
                                        {renderInline(part, `block-${blockIndex}-line-${lineIndex}`)}
                                    </span>
                                ))}
                            </blockquote>
                        );
                    }

                    return (
                        <p
                            key={`block-${blockIndex}`}
                            className="markdown-paragraph"
                        >
                            {block.content.split('\n').map((part, lineIndex) => (
                                <span key={`block-${blockIndex}-line-${lineIndex}`}>
                                    {lineIndex > 0 && <br />}
                                    {renderInline(part, `block-${blockIndex}-line-${lineIndex}`)}
                                </span>
                            ))}
                        </p>
                    );
                })}
            </div>

        );

    };

export default MarkdownMessage;

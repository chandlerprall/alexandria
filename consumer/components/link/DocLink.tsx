import React, { FunctionComponent, AnchorHTMLAttributes } from "react";
import { useArticleMeta } from "../utils/useArticleMeta";

export type DocLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	id: string;
	section?: string;
	text?: string;
};

const DocLink: FunctionComponent<DocLinkProps> = ({ id, section, text }) => {
	const article = useArticleMeta(id);

	if (article === undefined) {
		// Production doesn't show a big warning modal
		if (process.env.NODE_ENV === "production") {
			throw new Error(`${id} is not a valid id`);
		} else {
			// In dev we should alert the writer it's broken
			return (
				<p>
					There is a bad link reference on this page using the id of <strong>{id}</strong>
				</p>
			);
		}
	}

	const linkText = text ? text : article.title;
	const slug = section ? `${article.slug}#${section}` : article.slug;

	return <a href={slug}>{linkText}</a>;
};

export default DocLink;

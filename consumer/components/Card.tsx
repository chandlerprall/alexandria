import React from 'react';
import { css } from '@emotion/react';
import carddata, {CARD_PROJECT, CARD_POST} from './_carddata';
import Link from './Link';
import Headline from './Headline';

const row = css`
  display: flex;
  justify-content: space-between;
`;

const column = (basis: string | undefined = undefined, grow: string | undefined = undefined, shrink: string | undefined = undefined) => css`
  flex-basis: ${basis};
  flex-grow: ${grow};
  flex-shrink: ${shrink};
`

const cardCss = css`
	${row}
	${column('100%')}
	margin-bottom: 40px;
	flex-wrap: wrap;

	.cardTitle {
		${column('100%')}
		order: 0;
	}

	.cardContent {
		${column('100%')}
		order: 2;
		margin-top: 0;

		.sectionLink:nth-child(2) {
			float: right;
		}
	}

	.cardImage {
		${column('100%')}
		order: 1;

		img {
			box-shadow: 1px 4px 10px 0 #444;
			max-width: 100%;
		}
	}

	@media (min-width: 768px) {
		${column('45%')}

		&:nth-child(-n+2) {
			${column('100%')}

			.cardTitle {
				${column('55%')}
				height: 0;
			}

			.cardContent {
				${column('55%')}
				order: 1;
				margin-top: 2.5rem;
			}

			.cardImage {
				${column('40%')}
				order: 2;
			}
		}
	}

	@media (min-width: 850px) {
		${column('30%')}
	}
`;

export default function Card({ name }: { name: keyof typeof carddata }) {
    const { title, image, blurb, links } = carddata[name];
    const leftLink = <Link href={links.primary.href} routeName={links.primary.routeName} routeParams={links.primary.routeParams} className="sectionLink">{links.primary.text}</Link>;

    let rightLink;
    if (links.secondary) {
        rightLink = <Link href={links.secondary.href} routeName={links.secondary.routeName} routeParams={links.secondary.routeParams} className="sectionLink">{links.secondary.text}</Link>;
    }

    return (
        <div css={cardCss}>
            <section className="cardTitle">
                <Headline>{title}</Headline>
            </section>
            <section className="cardContent">
                <p>{blurb}</p>
                <p>{leftLink}{rightLink}</p>
            </section>
            <section className="cardImage">
                <Link href={links.primary.href} routeName={links.primary.routeName} routeParams={links.primary.routeParams}>
                    <img src={image} alt={title}/>
                </Link>
            </section>
        </div>
    );
}

Card.displayName = 'Card';

import React, { PureComponent } from "react";
import { css } from "@emotion/react";
import PageCentered from "./PageCentered";

const HEADER_SCROLL_DISTANCE = 100;

const BASE_TOP_PADDING = 10;
const TARGET_TOP_PADDING = 10;

const BASE_BOTTOM_PADDING = 10;
const TARGET_BOTTOM_PADDING = 5;

const BASE_HEADING_REM = 2.2;
const TARGET_HEADING_REM = 1.5;

const BASE_SUB_REM = 0.86;
const TARGET_SUB_REM = 0;

const headerCss = css`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	padding: 0;
	border-bottom: 3px solid #868686;
	background-color: #e4f7f9;
	color: #212121;

	.centered {
		display: flex;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	h1 {
		margin: 0;
		padding: 0;
	}

	nav {
		margin-left: 20px;
		text-align: right;
	}

	nav.textLinks {
		flex-grow: 1;
		order: 2;
	}

	nav.mediaLinks {
		height: 27px;
		order: 3;
	}

	nav .navlink {
		margin: 0 12px;
		font-size: 1.5rem;
		font-variant: small-caps;
	}

	@media (max-width: 800px) {
		nav {
			margin-left: 0;
			text-align: left;
		}

		nav.textLinks {
			order: 3;
		}

		nav.mediaLinks {
			order: 2;
			margin-left: 20px;
		}

		nav .navlink:first-of-type {
			margin-left: 0;
		}

		sub {
			display: none;
		}
	}
`;

export default class Header extends PureComponent<{}, { scrollTop: number }> {
	// @ts-ignore
	constructor(...args) {
		// @ts-ignore
		super(...args);

		this.onScroll = this.onScroll.bind(this);

		this.state = { scrollTop: 0 };
	}

	componentDidMount() {
		window.addEventListener("scroll", this.onScroll); // eslint-disable-line no-undef
	}

	componentWillUnmount() {
		window.removeEventListener("scroll", this.onScroll); // eslint-disable-line no-undef
	}

	onScroll() {
		this.setState({ scrollTop: document.scrollingElement?.scrollTop ?? 0 }); // eslint-disable-line no-undef
	}

	render() {
		const scrollTop = this.state.scrollTop;
		const scrollPerc = scrollTop / HEADER_SCROLL_DISTANCE;

		const headerStyles = {
			paddingTop: `${Math.max(BASE_TOP_PADDING - scrollPerc * (BASE_TOP_PADDING - TARGET_TOP_PADDING), TARGET_TOP_PADDING)}px`,
			paddingBottom: `${Math.max(BASE_BOTTOM_PADDING - scrollPerc * (BASE_BOTTOM_PADDING - TARGET_BOTTOM_PADDING), TARGET_BOTTOM_PADDING)}px`,
		};

		const h1FontSize = Math.max(BASE_HEADING_REM - scrollPerc * (BASE_HEADING_REM - TARGET_HEADING_REM), TARGET_HEADING_REM);

		const h1Styles = {
			fontSize: `${h1FontSize}rem`,
		};

		let subFontSize = Math.max(BASE_SUB_REM - scrollPerc * (BASE_SUB_REM - TARGET_SUB_REM), TARGET_SUB_REM);
		// const subStyles = {
		// 	fontSize: `${subFontSize}rem`,
		// 	lineHeight: `${subFontSize}rem`,
		// 	...(subFontSize === 0 ? { display: "none" } : {}),
		// };

		return (
			<header css={headerCss} style={headerStyles}>
				<PageCentered className="centered">
					<div
						css={css`
							height: ${h1FontSize + subFontSize}rem;
						`}
					>
						<h1 style={h1Styles}>Alexandria</h1>
						{/* <sup style={subStyles}></sup> */}
					</div>
					<nav className="textLinks">
						<a className="navlink" href="/">
							home
						</a>
						<a className="navlink" href="/about">
							about
						</a>
					</nav>
				</PageCentered>
			</header>
		);
	}
}

// @ts-ignore
Header.displayName = "Header";

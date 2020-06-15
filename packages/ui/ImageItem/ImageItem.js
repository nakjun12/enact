/*  eslint-disable react-hooks/rules-of-hooks */
//
// React Hook "useMemo" is called in the function of the "computed" object properly,
// which is neither a React function component or a custom React Hook function

/**
 * Unstyled image item components and behaviors to be customized by a theme or application.
 *
 * @module ui/ImageItem
 * @exports ImageItem
 */

import EnactPropTypes from '@enact/core/internal/prop-types';
import kind from '@enact/core/kind';
import PropTypes from 'prop-types';
import React from 'react';

import ComponentOverride from '../ComponentOverride';
import Image from '../Image';
import {Cell, Column, Row} from '../Layout';

import  {
	MemoPropsContext,
	MemoPropsDecorator,
	MemoPropsDOMAttributesContext
} from './MemoPropsDecorator';
import {reducedComputed} from './util';

import componentCss from './ImageItem.module.less';

// Adapts ComponentOverride to work within Cell since both use the component prop
function ImageOverride ({imageComponent, ...rest}) {
	return (
		<MemoPropsContext.Consumer>
			{(context) => {
				// console.log('ui:ImageOverride');
				return ComponentOverride({
					...rest,
					component: imageComponent,
					src: context && context.src || rest.src
				})
			}}
		</MemoPropsContext.Consumer>
	);
}

ImageOverride.propTypes = {
	/**
	 * The component used to render the image component.
	 *
	 * @type {Component|Element}
	 * @public
	 */
	imageComponent: EnactPropTypes.componentOverride
};

/**
 * A basic image item without any behavior.
 *
 * @class ImageItem
 * @memberof ui/ImageItem
 * @ui
 * @public
 */
const ImageItemBase = kind({
	name: 'ui:ImageItem',

	propTypes: /** @lends ui/ImageItem.ImageItem.prototype */ {
		/**
		 * The caption displayed with the image.
		 *
		 * @type {Node}
		 * @public
		 */
		children: PropTypes.node,

		/**
		 * Customizes the component by mapping the supplied collection of CSS class names to the
		 * corresponding internal elements and states of this component.
		 *
		 * The following classes are supported:
		 *
		 * * `imageItem` - The root component class
		 * * `caption` - The caption component class
		 * * `horizontal` - Applied when `orientation="horizontal"
		 * * `image` - The image component class
		 * * `selected` - Applied when `selected` prop is `true`
		 * * `vertical` - Applied when `orientation="vertical"
		 *
		 * @type {Object}
		 * @public
		 */
		css: PropTypes.object,

		/**
		 * The component used to render the image component.
		 *
		 * @type {Component|Element}
		 * @public
		 */
		imageComponent: EnactPropTypes.componentOverride,

		/**
		 * The layout orientation of the component.
		 *
		 * @type {('horizontal'|'vertical')}
		 * @default 'vertical'
		 * @public
		 */
		orientation: PropTypes.oneOf(['horizontal', 'vertical']),

		/**
		 * A placeholder image to be displayed before the image is loaded.
		 *
		 * @type {String}
		 * @public
		 */
		placeholder: PropTypes.string,

		/**
		 * Applies a selected visual effect to the image.
		 *
		 * @type {Boolean}
		 * @default false
		 * @public
		 */
		selected: PropTypes.bool,

		/**
		 * String value or Object of values used to determine which image will appear on a specific
		 * screenSize.
		 *
		 * @type {String|Object}
		 * @public
		 */
		src: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
	},

	defaultProps: {
		imageComponent: Image,
		orientation: 'vertical',
		selected: false
	},

	functional: true,

	styles: {
		css: componentCss,
		className: 'imageItem',
		publicClassNames: true
	},

	computed: {
		imageItem: ({children, css, imageComponent, orientation, placeholder, selected, src, styler, ...rest}) => {
			delete rest.selected;

			return reducedComputed({
				isHorizntal: () => (orientation === 'horizontal'),
				className: ({isHorizntal}) => {
					return styler.append(
						React.useMemo(
							() => {
								// console.log('ui:className');
								return {
									selected,
									horizontal: isHorizntal,
									vertical: !isHorizntal
								};
							},
							[isHorizntal, selected]
						)
					);
				},
				memoImage: ({isHorizntal}) => {
					return React.useMemo(() => {
						// console.log('ui:memoImage');
						return (
							<Cell
								className={css.image}
								component={ImageOverride}
								imageComponent={imageComponent}
								placeholder={placeholder}
								shrink={isHorizntal}
								src={src}
							/>
						);
						// We don't need the dependency of the `src` because it will be passed through a context.
						// We compare imageComponent.type for dependency instead of imageComponent.
						// eslint-disable-next-line react-hooks/exhaustive-deps
					}, [css.image, imageComponent, isHorizntal, placeholder]);
				},
				memoChildren: () => {
					return React.useMemo(() => {
						// console.log('ui:memoChildren');
						return children;
					}, [children]);
				},
				content: ({memoChildren, isHorizntal}) => {
					return React.useMemo(() => {
						// console.log('ui:content');
						return (
							<Cell
								className={css.caption}
								shrink={!isHorizntal}
								// eslint-disable-next-line no-undefined
								align={isHorizntal ? 'center' : undefined}
							>
								{memoChildren}
							</Cell>
						);
					}, [css.caption, isHorizntal, memoChildren]);
				},
				imageContent: ({className, content, memoImage}) => {
					return React.useMemo(() => {
						const Component = orientation === 'horizontal' ? Row : Column;
						// console.log('ui:imageContent');
						return (
							<Component {...rest} className={className}>
								<MemoPropsContext.Consumer>
									{() => ([memoImage, content])}
								</MemoPropsContext.Consumer>
							</Component>
						);
					}, [className]);
				},
				imageItem: ({imageContent}) => {
					return (
						<MemoPropsDOMAttributesContext attr={['data-index']}>
							{imageContent}
						</MemoPropsDOMAttributesContext>
					);
				}
			});
		}
	},

	render: ({imageItem}) => {
		// console.log('ui:render');
		return imageItem;
	}
});

const ImageItem = ImageItemBase;

export default ImageItemBase;
export {
	ImageItem,
	MemoPropsDecorator,
	MemoPropsContext,
	MemoPropsDOMAttributesContext,
	reducedComputed
};

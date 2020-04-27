import React from 'react';

function computeAriaLabel (hint, prehint, aria, content) {
	if (!aria) {
		const
			prefix = content || null,
			label = prehint && prefix && hint && (prehint + ' ' + prefix + ' ' + hint) ||
				prehint && prefix && (prehint + ' ' + prefix) ||
				prehint && hint && (prehint + ' ' + hint) ||
				hint && prefix && (prefix + ' ' + hint) ||
				prehint ||
				hint ||
				null;

		return label;
	}

	return aria;
}

/**
 * Configuration for `useA11y`
 *
 * @typedef {Object} useA11yConfig
 * @memberof ui/A11yDecorator
 * @property {String}  [accessibilityHint]    Sets the hint text to be read after the content.
 * @property {String}  [accessibilityPreHint] Sets the hint text to be read before the content.
 * @property {String}  [aria-label]           Sets the value of the `aria-label` attribute for the wrapped component.
 * @property {String}  [content]              The accessibility content.
 * @private
 */

/**
 * Object returned by `useA11y`
 *
 * @typedef {Object} useA11yInterface
 * @memberof ui/A11yDecorator
 * @property {String}  [aria-label]           The value of the `aria-label` attribute for the wrapped component.
 * @private
 */

/**
 * Manages a accessibility label.
 * The accessibility label is decorated with `accessibilityPreHint`, `accessibilityHint`, and `content`.
 *
 * @param {useA11yConfig} config Configuration options
 * @returns {useA11yInterface}
 * @private
 */
const useA11y = ({accessibilityHint, accessibilityPreHint, 'aria-label': ariaLabel, content}) => {
	return {
		'aria-label': React.useMemo(
			() => computeAriaLabel(accessibilityHint, accessibilityPreHint, ariaLabel, content),
			[accessibilityHint, accessibilityPreHint, ariaLabel, content]
		)
	};
};

export default useA11y;
export {
	useA11y
};
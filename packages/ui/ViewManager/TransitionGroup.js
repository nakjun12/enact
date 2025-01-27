/*
 * Exports the {@link ui/ViewManager.TransitionGroup} component.
 */

// Using string refs from the source code of ReactTransitionGroup

import EnactPropTypes from '@enact/core/internal/prop-types';
import {forward, forwardCustom} from '@enact/core/handle';
import PropTypes from 'prop-types';
import eqBy from 'ramda/src/eqBy';
import findIndex from 'ramda/src/findIndex';
import identity from 'ramda/src/identity';
import prop from 'ramda/src/prop';
import propEq from 'ramda/src/propEq';
import remove from 'ramda/src/remove';
import unionWith from 'ramda/src/unionWith';
import useWith from 'ramda/src/useWith';
import {Children, cloneElement, createElement, Component} from 'react';

/**
 * Returns the index of a child in an array found by `key` matching
 *
 * @param {Object} child React element to find
 * @param {Object[]} children Array of React elements
 * @returns {Number} Index of child
 * @method
 * @private
 */
// eslint-disable-next-line react-hooks/rules-of-hooks
const indexOfChild = useWith(findIndex, [propEq('key'), identity]);

/**
 * Returns an array of non-null children
 *
 * @param  {Object[]} children Array of React children
 *
 * @returns {Object[]}          Array of children
 * @private
 */
const mapChildren = function (children) {
	const result = children && Children.toArray(children);
	return result ? result.filter(c => !!c) : [];
};

/**
 * Merges two arrays of children without any duplicates (by `key`)
 *
 * @param {Object[]} a Set of children
 * @param {Object[]} b Set of children
 * @returns {Object[]} Merged set of children
 * @method
 * @private
 */
const mergeChildren = unionWith(eqBy(prop('key')));

// Cached event forwarders
const forwardOnAppear = forward('onAppear');
const forwardOnEnter = forward('onEnter');
const forwardOnLeave = forward('onLeave');
const forwardOnStay = forward('onStay');

/**
 * Manages the transition of added and removed child components. Children that are added are
 * transitioned in and those removed are transition out via optional callbacks on the child.
 *
 * Ported from [ReactTransitionGroup]
 * (https://facebook.github.io/react/docs/animation.html#low-level-api-reacttransitiongroup).
 * Currently somewhat specialized for the purposes of ViewManager.
 *
 * @class TransitionGroup
 * @memberof ui/ViewManager
 * @private
 */

class TransitionGroup extends Component {
	static propTypes = /** @lends ui/ViewManager.TransitionGroup.prototype */ {
		children: PropTypes.node.isRequired,

		/**
		 * Adapts children to be compatible with TransitionGroup
		 *
		 * @type {Function}
		 */
		childFactory: PropTypes.func,

		/**
		 * Type of component wrapping the children.
		 *
		 * May be a DOM node or a custom React component.
		 *
		 * @type {String|Component}
		 * @default 'div'
		 */
		component: EnactPropTypes.renderable,

		/**
		 * Called with a reference to {@link ui/ViewManager.TransitionGroup.component|component}
		 *
		 * @type {Object|Function}
		 * @private
		 */
		componentRef: EnactPropTypes.ref,

		/**
		 * Current Index the ViewManager is on
		 *
		 * @type {Number}
		 */
		currentIndex: PropTypes.number,

		/**
		 * Called when each view is rendered during initial construction.
		 *
		 * @type {Function}
		 */
		onAppear: PropTypes.func,

		/**
		 * Called when each view completes its transition into the viewport.
		 *
		 * @type {Function}
		 */
		onEnter: PropTypes.func,

		/**
		 * Called when each view completes its transition out of the viewport.
		 *
		 * @type {Function}
		 */
		onLeave: PropTypes.func,

		/**
		 * Called when each view completes its transition within the viewport.
		 *
		 * @type {Function}
		 */
		onStay: PropTypes.func,

		/**
		 * Called once when all views have completed their transition.
		 *
		 * @type {Function}
		 */
		onTransition: PropTypes.func,

		/**
		 * Called once before views begin their transition.
		 *
		 * @type {Function}
		 */
		onWillTransition: PropTypes.func,

		/**
		 * Maximum number of rendered children.
		 *
		 * Used to limit how many visible transitions are active at any time.
		 * A value of 1 would prevent any exit transitions whereas a value of 2,
		 * the default, would ensure that only 1 view is transitioning on and 1 view is
		 * transitioning off at a time.
		 *
		 * @type {Number}
		 * @default 2
		 */
		size: PropTypes.number
	};

	static defaultProps = {
		childFactory: identity,
		component: 'div',
		size: 2
	};

	constructor (props) {
		super(props);
		this.state = {
			firstRender: true,
			children: []
		};

		this.hasMounted = false;
		this.currentlyTransitioningKeys = {};
		this.keysToEnter = [];
		this.keysToLeave = [];
		this.keysToStay = [];
		this.groupRefs = {};
	}

	static getDerivedStateFromProps (props, state) {
		const children = mapChildren(props.children).slice(0, props.size);

		if (state.firstRender) {
			return {
				activeChildren: children,
				children,
				firstRender: false
			};
		}

		return {
			activeChildren: children,
			children: mergeChildren(children, state.children).slice(0, props.size)
		};
	}

	componentDidMount () {
		this.hasMounted = true;

		// this isn't used by ViewManager or View at the moment but leaving it around for future
		// flexibility
		this.state.children.forEach(child => this.performAppear(child.key));
	}

	componentDidUpdate (prevProps, prevState) {
		this.reconcileUnmountedChildren(prevState.children, this.state.children);
		this.reconcileChildren(prevState.activeChildren, this.state.activeChildren);
	}

	reconcileUnmountedChildren (prevChildMapping, nextChildMapping) {
		const nextChildKeys = nextChildMapping.map(c => c.key);
		const prevChildKeys = prevChildMapping.map(c => c.key);

		// `state.children` represents the mounted children. if a view change happens during a
		// transition causing the View to be unmounted before it fires its callback, the
		// currentlyTransitioningKeys map will be out of sync. To manage that, we check for keys
		// that have fallen out of the `children` array and manually clean them up from the map.
		prevChildKeys
			.filter(key => !nextChildKeys.includes(key))
			.forEach(key => this.completeTransition({key}));
	}

	reconcileChildren (prevActiveChildMapping, nextActiveChildMapping) {
		const {size} = this.props;

		const nextChildKeys = nextActiveChildMapping.map(c => c.key);
		const prevChildKeys = prevActiveChildMapping.map(c => c.key);
		const droppedKeys = prevChildKeys.filter(key => !nextChildKeys.includes(key));

		// if children haven't changed, there's nothing to reconcile
		if (prevActiveChildMapping.length === nextActiveChildMapping.length && droppedKeys.length === 0) {
			return;
		}

		// remove any "dropped" children from the list of transitioning children
		droppedKeys.forEach(key => this.completeTransition({key}));

		// mark any new child as entering
		nextChildKeys.forEach((key, index) => {
			const hasPrev = prevChildKeys.includes(key);

			if (!hasPrev || this.currentlyTransitioningKeys[key]) {
				// flag a view to enter if it's new (!hasPrev), or if it's not new (hasPrev) but is
				// re-entering (is currently transitioning)
				this.keysToEnter.push(key);
			} else if (index < size - 1) {
				// keep views that are less than size minus the "transition out" buffer
				this.keysToStay.push(key);
			} else {
				// everything else is leaving
				this.keysToLeave.push(key);
			}
		});

		// mark any previous child not remaining as leaving
		prevChildKeys.forEach(key => {
			const hasNext = nextChildKeys.includes(key);
			const isRendered = Boolean(this.groupRefs[key]);
			// flag a view to leave if it isn't in the new set (!hasNext) and it exists (isRendered)
			if (!hasNext && isRendered) {
				this.keysToLeave.push(key);
			}
		});

		if (this.keysToEnter.length || this.keysToLeave.length) {
			forwardCustom('onWillTransition')(null, this.props);
		}

		// once the component has been updated, start the enter transition for new children,
		const keysToEnter = this.keysToEnter;
		this.keysToEnter = [];
		keysToEnter.forEach(this.performEnter);

		// ... the stay transition for any children remaining,
		const keysToStay = this.keysToStay;
		this.keysToStay = [];
		keysToStay.forEach(this.performStay);

		// ... and the leave transition for departing children
		const keysToLeave = this.keysToLeave;
		this.keysToLeave = [];
		keysToLeave.forEach(this.performLeave);
	}

	completeTransition ({key, noForwarding = false}) {
		if (key in this.currentlyTransitioningKeys) {
			delete this.currentlyTransitioningKeys[key];

			if (!noForwarding && Object.keys(this.currentlyTransitioningKeys).length === 0) {
				forwardCustom('onTransition')(null, this.props);
			}
		}
	}

	performAppear = (key) => {
		this.currentlyTransitioningKeys[key] = true;

		const component = this.groupRefs[key];

		if (component.componentWillAppear) {
			component.componentWillAppear(
				this._handleDoneAppearing.bind(this, key)
			);
		} else {
			this._handleDoneAppearing(key);
		}
	};

	_handleDoneAppearing = (key) => {
		const component = this.groupRefs[key];
		if (component.componentDidAppear) {
			component.componentDidAppear();
		}

		forwardOnAppear({
			type: 'onAppear',
			view: component
		}, this.props);

		this.completeTransition({key, noForwarding: true});

		let currentChildMapping = mapChildren(this.props.children);

		if (!currentChildMapping || !currentChildMapping.find(child => child.key === key)) {
			// This was removed before it had fully appeared. Remove it.
			this.performLeave(key);
		}
	};

	performEnter = (key) => {
		this.currentlyTransitioningKeys[key] = true;

		const component = this.groupRefs[key];

		if (component.componentWillEnter) {
			component.componentWillEnter(
				this._handleDoneEntering.bind(this, key)
			);
		} else {
			this._handleDoneEntering(key);
		}
	};

	_handleDoneEntering = (key) => {
		const component = this.groupRefs[key];
		if (component.componentDidEnter) {
			component.componentDidEnter();
		}

		forwardOnEnter({
			type: 'onEnter',
			view: component
		}, this.props);

		this.completeTransition({key});
	};

	performStay = (key) => {
		const component = this.groupRefs[key];

		if (component.componentWillStay) {
			component.componentWillStay(
				this._handleDoneStaying.bind(this, key)
			);
		} else {
			this._handleDoneStaying(key);
		}
	};

	_handleDoneStaying = (key) => {
		const component = this.groupRefs[key];
		if (component.componentDidStay) {
			component.componentDidStay();
		}

		forwardOnStay({
			type: 'onStay',
			view: component
		}, this.props);
	};

	performLeave = (key) => {
		this.currentlyTransitioningKeys[key] = true;

		const component = this.groupRefs[key];
		if (component.componentWillLeave) {
			component.componentWillLeave(this._handleDoneLeaving.bind(this, key));
		} else {
			// Note that this is somewhat dangerous b/c it calls setState()
			// again, effectively mutating the component before all the work
			// is done.
			this._handleDoneLeaving(key);
		}
	};

	_handleDoneLeaving = (key) => {
		const component = this.groupRefs[key];

		if (component.componentDidLeave) {
			component.componentDidLeave();
		}

		forwardOnLeave({
			type: 'onLeave',
			view: component
		}, this.props);

		this.completeTransition({key});

		this.setState(function (state) {
			const index = indexOfChild(key, state.children);
			return {children: remove(index, 1, state.children)};
		});
	};

	storeRefs = key => node => {
		this.groupRefs[key] = node;
	};

	render () {
		// support wrapping arbitrary children with a component that supports the necessary
		// lifecycle methods to animate transitions
		const childrenToRender = this.state.children.map(child => {
			const isLeaving = child.props['data-index'] !== this.props.currentIndex && typeof child.props['data-index'] !== 'undefined';

			return cloneElement(
				this.props.childFactory(child),
				{key: child.key, ref: this.storeRefs(child.key), leaving: isLeaving, appearing: !this.hasMounted}
			);
		});

		// Do not forward TransitionGroup props to primitive DOM nodes
		const props = Object.assign({}, this.props);
		props.ref = this.props.componentRef;
		delete props.childFactory;
		delete props.component;
		delete props.componentRef;
		delete props.currentIndex;
		delete props.onAppear;
		delete props.onEnter;
		delete props.onLeave;
		delete props.onStay;
		delete props.onTransition;
		delete props.onWillTransition;
		delete props.size;

		return createElement(
			this.props.component,
			props,
			childrenToRender
		);
	}
}

export default TransitionGroup;
export {TransitionGroup};

// eslint-disable-next-line import/extensions
import { stringifyPathData } from 'svgo/lib/path.js';

/**
 * @typedef {import('svgo/lib/types').PathDataItem} PathDataItem
 */

/**
 * A custom svgo plugin that converts rounded rectangles to paths.
 * It is both based on, and fills in missing functionality from,
 * the `convertShapeToPath` plugin.
 */
export default {
  name: 'convertRoundedRectToPath',
  description: 'convert rounded rectangles to paths',
  /**
   * @type {import('svgo/plugins-types').Plugin<'convertRoundedRectToPath'>}
   */
  fn: (root, params) => {
    const { floatPrecision: precision } = params;

    return {
      element: {
        enter: (node) => {
          if (
            node.name === 'rect' &&
            node.attributes.width != null &&
            node.attributes.height != null &&
            (node.attributes.rx != null || node.attributes.ry != null)
          ) {
            const x = Number(node.attributes.x || '0');
            const y = Number(node.attributes.y || '0');
            const width = Number(node.attributes.width);
            const height = Number(node.attributes.height);
            const rx = Number(node.attributes.rx);
            const ry = Number(node.attributes.ry ?? node.attributes.rx);
            // Values like '100%' compute to NaN, thus running after
            // cleanupNumericValues when 'px' units has already been removed.
            // TODO: Calculate sizes from % and non-px units if possible.
            if (Number.isNaN(x - y + width - height)) return;
            /**
             * @type {PathDataItem[]}
             */
            const pathData = [
              { command: 'M', args: [x, y + ry] },
              { command: 'A', args: [rx, ry, 0, 0, 1, x + rx, y] },
              { command: 'H', args: [x + width - rx] },
              { command: 'A', args: [rx, ry, 0, 0, 1, x + width, y + ry] },
              { command: 'V', args: [y + height - ry] },
              { command: 'A', args: [rx, ry, 0, 0, 1, x + width - rx, y + height] },
              { command: 'H', args: [x + rx] },
              { command: 'A', args: [rx, ry, 0, 0, 1, x, y + height - ry] },
              { command: 'z', args: [] },
            ];
            node.name = 'path';
            node.attributes.d = stringifyPathData({ pathData, precision });
            delete node.attributes.x;
            delete node.attributes.y;
            delete node.attributes.rx;
            delete node.attributes.ry;
            delete node.attributes.width;
            delete node.attributes.height;
          }
        },
      },
    };
  },
};

type ScrollLogicalPosition = 'start' | 'center' | 'end' | 'nearest';
type ScrollMode = 'always' | 'if-needed';
type Boundary = Element | ((element: Element) => boolean) | null | undefined;

interface ComputeOptions {
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
  scrollMode?: ScrollMode;
  boundary?: Boundary;
  skipOverflowHiddenElements?: boolean;
}

interface ScrollAction {
  el: Element;
  top: number;
  left: number;
}

function isElement(value: unknown): value is Element {
  return typeof value === 'object' && value !== null && (value as Element).nodeType === 1;
}

function canOverflow(overflow: string | null, skipOverflowHiddenElements?: boolean) {
  if (skipOverflowHiddenElements && overflow === 'hidden') {
    return false;
  }

  return overflow !== 'visible' && overflow !== 'clip';
}

function getFrameElement(element: Element) {
  if (!element.ownerDocument || !element.ownerDocument.defaultView) {
    return null;
  }

  try {
    return element.ownerDocument.defaultView.frameElement;
  } catch {
    return null;
  }
}

function isHiddenByFrame(element: Element) {
  const frame = getFrameElement(element);
  if (!frame) {
    return false;
  }

  return frame.clientHeight < element.scrollHeight || frame.clientWidth < element.scrollWidth;
}

function isScrollable(element: Element, skipOverflowHiddenElements?: boolean) {
  if (element.clientHeight < element.scrollHeight || element.clientWidth < element.scrollWidth) {
    const style = getComputedStyle(element, null);
    return (
      canOverflow(style.overflowY, skipOverflowHiddenElements) ||
      canOverflow(style.overflowX, skipOverflowHiddenElements) ||
      isHiddenByFrame(element)
    );
  }

  return false;
}

function alignNearest(
  scrollingEdgeStart: number,
  scrollingEdgeEnd: number,
  scrollingSize: number,
  scrollingBorderStart: number,
  scrollingBorderEnd: number,
  elementEdgeStart: number,
  elementEdgeEnd: number,
  elementSize: number,
) {
  if (
    (elementEdgeStart < scrollingEdgeStart && elementEdgeEnd > scrollingEdgeEnd) ||
    (elementEdgeStart > scrollingEdgeStart && elementEdgeEnd < scrollingEdgeEnd)
  ) {
    return 0;
  }

  if (
    (elementEdgeStart <= scrollingEdgeStart && elementSize <= scrollingSize) ||
    (elementEdgeEnd >= scrollingEdgeEnd && elementSize >= scrollingSize)
  ) {
    return elementEdgeStart - scrollingEdgeStart - scrollingBorderStart;
  }

  if (
    (elementEdgeEnd > scrollingEdgeEnd && elementSize < scrollingSize) ||
    (elementEdgeStart < scrollingEdgeStart && elementSize > scrollingSize)
  ) {
    return elementEdgeEnd - scrollingEdgeEnd + scrollingBorderEnd;
  }

  return 0;
}

function getParentElement(element: Element) {
  const parent = element.parentElement;
  return parent ?? (element.getRootNode() as ShadowRoot).host ?? null;
}

// Compatibility shim adapted from compute-scroll-into-view@1.0.20 so legacy
// Slate dependencies used by Keystatic keep working under Vite/Rollup.
export function compute(target: Element, options: ComputeOptions): ScrollAction[] {
  const viewportWindow = window;
  const scrollMode = options.scrollMode;
  const block = options.block ?? 'start';
  const inline = options.inline ?? 'nearest';
  const boundary = options.boundary;
  const skipOverflowHiddenElements = options.skipOverflowHiddenElements;
  const checkBoundary =
    typeof boundary === 'function' ? boundary : (element: Element) => element !== boundary;

  if (!isElement(target)) {
    throw new TypeError('Invalid target');
  }

  const scrollingElement = document.scrollingElement || document.documentElement;
  const frames: Element[] = [];
  let cursor: Element | null = target;

  while (isElement(cursor) && checkBoundary(cursor)) {
    cursor = getParentElement(cursor);
    if (cursor === scrollingElement) {
      frames.push(cursor);
      break;
    }

    if (
      (cursor === document.body && isScrollable(cursor) && !isScrollable(document.documentElement)) ||
      (cursor !== null && isScrollable(cursor, skipOverflowHiddenElements))
    ) {
      frames.push(cursor);
    }
  }

  const viewportWidth = viewportWindow.visualViewport ? viewportWindow.visualViewport.width : innerWidth;
  const viewportHeight = viewportWindow.visualViewport ? viewportWindow.visualViewport.height : innerHeight;
  const viewportX = window.scrollX || pageXOffset;
  const viewportY = window.scrollY || pageYOffset;

  const targetRect = target.getBoundingClientRect();
  const targetHeight = targetRect.height;
  const targetWidth = targetRect.width;
  const targetTop = targetRect.top;
  const targetRight = targetRect.right;
  const targetBottom = targetRect.bottom;
  const targetLeft = targetRect.left;

  let targetBlock =
    block === 'start' || block === 'nearest'
      ? targetTop
      : block === 'end'
        ? targetBottom
        : targetTop + targetHeight / 2;
  let targetInline =
    inline === 'center' ? targetLeft + targetWidth / 2 : inline === 'end' ? targetRight : targetLeft;

  const computations: ScrollAction[] = [];

  for (const frame of frames) {
    const frameRect = frame.getBoundingClientRect();
    const frameHeight = frameRect.height;
    const frameWidth = frameRect.width;
    const frameTop = frameRect.top;
    const frameRight = frameRect.right;
    const frameBottom = frameRect.bottom;
    const frameLeft = frameRect.left;

    if (
      scrollMode === 'if-needed' &&
      targetTop >= 0 &&
      targetLeft >= 0 &&
      targetBottom <= viewportHeight &&
      targetRight <= viewportWidth &&
      targetTop >= frameTop &&
      targetBottom <= frameBottom &&
      targetLeft >= frameLeft &&
      targetRight <= frameRight
    ) {
      return computations;
    }

    const frameStyle = getComputedStyle(frame);
    const borderLeft = parseInt(frameStyle.borderLeftWidth, 10);
    const borderTop = parseInt(frameStyle.borderTopWidth, 10);
    const borderRight = parseInt(frameStyle.borderRightWidth, 10);
    const borderBottom = parseInt(frameStyle.borderBottomWidth, 10);

    const scrollbarWidth =
      'offsetWidth' in frame ? (frame as HTMLElement).offsetWidth - frame.clientWidth - borderLeft - borderRight : 0;
    const scrollbarHeight =
      'offsetHeight' in frame ? (frame as HTMLElement).offsetHeight - frame.clientHeight - borderTop - borderBottom : 0;

    const scaleX = 'offsetWidth' in frame ? ((frame as HTMLElement).offsetWidth === 0 ? 0 : frameWidth / (frame as HTMLElement).offsetWidth) : 0;
    const scaleY = 'offsetHeight' in frame ? ((frame as HTMLElement).offsetHeight === 0 ? 0 : frameHeight / (frame as HTMLElement).offsetHeight) : 0;

    let blockScroll = 0;
    let inlineScroll = 0;

    if (frame === scrollingElement) {
      blockScroll =
        block === 'start'
          ? targetBlock
          : block === 'end'
            ? targetBlock - viewportHeight
            : block === 'nearest'
              ? alignNearest(
                  viewportY,
                  viewportY + viewportHeight,
                  viewportHeight,
                  borderTop,
                  borderBottom,
                  viewportY + targetBlock,
                  viewportY + targetBlock + targetHeight,
                  targetHeight,
                )
              : targetBlock - viewportHeight / 2;

      inlineScroll =
        inline === 'start'
          ? targetInline
          : inline === 'center'
            ? targetInline - viewportWidth / 2
            : inline === 'end'
              ? targetInline - viewportWidth
              : alignNearest(
                  viewportX,
                  viewportX + viewportWidth,
                  viewportWidth,
                  borderLeft,
                  borderRight,
                  viewportX + targetInline,
                  viewportX + targetInline + targetWidth,
                  targetWidth,
                );

      blockScroll = Math.max(0, blockScroll + viewportY);
      inlineScroll = Math.max(0, inlineScroll + viewportX);
    } else {
      blockScroll =
        block === 'start'
          ? targetBlock - frameTop - borderTop
          : block === 'end'
            ? targetBlock - frameBottom + borderBottom + scrollbarHeight
            : block === 'nearest'
              ? alignNearest(
                  frameTop,
                  frameBottom,
                  frameHeight,
                  borderTop,
                  borderBottom + scrollbarHeight,
                  targetBlock,
                  targetBlock + targetHeight,
                  targetHeight,
                )
              : targetBlock - (frameTop + frameHeight / 2) + scrollbarHeight / 2;

      inlineScroll =
        inline === 'start'
          ? targetInline - frameLeft - borderLeft
          : inline === 'center'
            ? targetInline - (frameLeft + frameWidth / 2) + scrollbarWidth / 2
            : inline === 'end'
              ? targetInline - frameRight + borderRight + scrollbarWidth
              : alignNearest(
                  frameLeft,
                  frameRight,
                  frameWidth,
                  borderLeft,
                  borderRight + scrollbarWidth,
                  targetInline,
                  targetInline + targetWidth,
                  targetWidth,
                );

      const elementFrame = frame as HTMLElement;
      const scrollLeft = elementFrame.scrollLeft;
      const scrollTop = elementFrame.scrollTop;

      blockScroll = Math.max(
        0,
        Math.min(
          scrollTop + blockScroll / scaleY,
          elementFrame.scrollHeight - frameHeight / scaleY + scrollbarHeight,
        ),
      );
      inlineScroll = Math.max(
        0,
        Math.min(
          scrollLeft + inlineScroll / scaleX,
          elementFrame.scrollWidth - frameWidth / scaleX + scrollbarWidth,
        ),
      );

      targetBlock += scrollTop - blockScroll;
      targetInline += scrollLeft - inlineScroll;
    }

    computations.push({ el: frame, top: blockScroll, left: inlineScroll });
  }

  return computations;
}

export default compute;

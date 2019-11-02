import classNames from "classnames";
import _ from "lodash";
import * as React from "react";
import ReactDOM from "react-dom";
import Svg from "svgjs";
import { dataService } from "../../services";
import { RdfQName } from "../../services/dataService";
import { ILayoutNode, layoutFamilyTree } from "./layout";

export interface IFamilyTreeData {
    roots: string[];
    // s - s
    mates: [string, string][];
    // p + p -> c
    children: [string, string | null | undefined, string][];
}

export interface IRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export type NodeRenderCallback = (id: string, boundingRect: Readonly<IRect>) => React.ReactNode;

export interface IFamilyTreeProps {
    className?: string;
    familyTree: Readonly<IFamilyTreeData>;
    nodeWidth?: number;
    nodeHeight?: number;
    nodeSpacingX?: number;
    nodeSpacingY?: number;
    onRenderNode?: NodeRenderCallback;
    debugInfo?: boolean;
    onRendered?: (sender: FamilyTree) => void;
}

const FAMILY_TREE_MATE_SLOT_OFFSET = 10;

export class FamilyTree extends React.PureComponent<IFamilyTreeProps> {
    public static defaultProps: Partial<IFamilyTreeProps> = {
        onRenderNode(id, brct): React.ReactNode {
            return id;
        }
    };
    private _drawingRoot: HTMLDivElement | null | undefined;
    private _portalNodes: [HTMLElement, React.ReactNode][] = [];
    private _idContainerMap = new Map<string, HTMLElement>();
    private _pendingOnRenderedCall = false;
    public constructor(props: IFamilyTreeProps) {
        super(props);
        this._updateDrawing = _.debounce(this._updateDrawing, 100);
    }
    private _updateDrawing = (): void => {
        // console.log(dumpFamilyTreeData(this.props.familyTree));
        if (!this._drawingRoot) return;
        this._pendingOnRenderedCall = true;
        this._portalNodes = [];
        while (this._drawingRoot.hasChildNodes())
            this._drawingRoot.firstChild!.remove();
        this._idContainerMap.clear();
        // Render
        const layout = layoutFamilyTree(this.props.familyTree);
        if (!layout) return;
        const FAMILY_TREE_BOX_WIDTH = this.props.nodeWidth == null ? 100 : this.props.nodeWidth;
        const FAMILY_TREE_BOX_HEIGHT = this.props.nodeHeight == null ? 50 : this.props.nodeHeight;
        const FAMILY_TREE_BOX_SPACING_X = this.props.nodeSpacingX == null ? 50 : this.props.nodeSpacingX;
        const FAMILY_TREE_BOX_SPACING_Y = this.props.nodeSpacingY == null ? 20 : this.props.nodeSpacingY;
        const rootScaleX = FAMILY_TREE_BOX_WIDTH + FAMILY_TREE_BOX_SPACING_X;
        const minSpacingScaleX = (FAMILY_TREE_BOX_WIDTH + FAMILY_TREE_BOX_SPACING_X) / layout.minNodeSpacingX;
        const scaleX = minSpacingScaleX * 0.8 + rootScaleX * 0.2;
        const drawingWidth = layout.rawWidth * scaleX;
        const rowTop: number[] = [0];
        for (let row = 0; row < layout.rows.length; row++) {
            rowTop.push(rowTop[row] + layout.rowSlotCount[row] * FAMILY_TREE_MATE_SLOT_OFFSET + FAMILY_TREE_BOX_HEIGHT + FAMILY_TREE_BOX_SPACING_Y);
        }
        const drawingHeight = rowTop[rowTop.length - 1];
        // Note the px in svg represents a physical length.
        const drawing = Svg(this._drawingRoot)
            .size(drawingWidth + FAMILY_TREE_BOX_WIDTH, drawingHeight)
            .viewbox(-FAMILY_TREE_BOX_WIDTH / 2, 0, drawingWidth + FAMILY_TREE_BOX_WIDTH, drawingHeight);
        function getNodeRect(node: ILayoutNode): IRect {
            return {
                left: node.offsetX! * scaleX - FAMILY_TREE_BOX_WIDTH / 2,
                top: rowTop[node.row],
                width: FAMILY_TREE_BOX_WIDTH,
                height: FAMILY_TREE_BOX_HEIGHT
            };
        }
        function getSlotY(rect: IRect, slotIndex: number): number {
            if (slotIndex === 0) return rect.top + rect.height / 2;
            return rect.top + rect.height + FAMILY_TREE_BOX_SPACING_Y / 2 + FAMILY_TREE_MATE_SLOT_OFFSET * slotIndex;
        }
        // Draw nodes.
        for (let rowi = 0; rowi < layout.rows.length; rowi++) {
            const row = layout.rows[rowi];
            for (let coli = 0; coli < row.length; coli++) {
                const node = row[coli];
                const bRect: IRect = getNodeRect(node);
                drawing.rect(bRect.width, bRect.height)
                    .move(bRect.left, bRect.top)
                    .fill("none")
                    .stroke("none");
                if (this.props.onRenderNode) {
                    const renderedNode = this.props.onRenderNode(node.id, bRect);
                    if (renderedNode) {
                        const container = drawing
                            .element("foreignObject")
                            .move(bRect.left, bRect.top)
                            .size(bRect.width, bRect.height);
                        this._portalNodes.push([container.native(), renderedNode]);
                        this._idContainerMap.set(node.id, container.native());
                    }
                }
                if (this.props.debugInfo) {
                    const lines = [`${node.row},${node.column} (${Math.round(node.offsetX * 10) / 10})`];
                    for (const connection of layout.connections) {
                        if ("id2" in connection) {
                            const { id1, id2, slot1, childrenSlot } = connection;
                            if (id1 !== node.id && id2 !== node.id) continue;
                            lines.push(`${id1} -- ${id2} | S${slot1}${childrenSlot && (" | CS" + childrenSlot) || ""}`);
                        } else {
                            const { id1, childrenSlot } = connection;
                            if (id1 !== node.id) continue;
                            lines.push(`${id1} | ${childrenSlot && (" | CS" + childrenSlot) || ""}`);
                        }
                    }
                    drawing.text(lines.join("\n"))
                        .font({ size: 9 })
                        .move(bRect.left, bRect.top + bRect.height);
                }
            }
        }
        // Draw connections.
        for (const connection of layout.connections) {
            if ("id2" in connection) {
                // ICoupleLayoutConnection
                const { id1, id2, slot1, childrenId, childrenSlot } = connection;
                const node1 = layout.nodeFromId(id1);
                const node2 = layout.nodeFromId(id2);
                console.assert(node1, "Mate node [0] missing", id1, id2);
                console.assert(node2, "Mate node [1] missing", id1, id2);
                if (!node1 || !node2) continue;
                const nodeL = node1.offsetX < node2.offsetX ? node1 : node2;
                const nodeR = node1.offsetX < node2.offsetX ? node2 : node1;
                const rectL = getNodeRect(nodeL);
                const rectR = getNodeRect(nodeR);
                console.assert((childrenId == null) == (childrenSlot == null));
                if (slot1 === 0) {
                    const mateLineY = rectL.top + rectL.height / 2;
                    drawing
                        .line(rectL.left + rectL.width, mateLineY, rectR.left, mateLineY)
                        .addClass("family-tree-connection family-tree-connection-mate");
                    if (childrenId && childrenSlot) {
                        const centerX = ((rectL.left + rectL.width) + rectR.left) / 2;
                        for (const childId of childrenId) {
                            const nodeC = layout.nodeFromId(childId)!;
                            const rectC = getNodeRect(nodeC);
                            plotElbowHorizontal(drawing,
                                centerX, mateLineY,
                                getSlotY(rectL, childrenSlot),
                                rectC.left + rectC.width / 2, rectC.top
                            ).addClass("family-tree-connection family-tree-connection-child");
                        }
                    }
                } else if (nodeL.row === nodeR.row) {
                    const slotY = getSlotY(rectL, slot1);
                    plotElbowHorizontal(drawing,
                        rectL.left + rectL.width / 2, rectL.top + rectL.height,
                        slotY,
                        rectR.left + rectR.width / 2, rectR.top + rectR.height
                    ).addClass("family-tree-connection family-tree-connection-mate");
                    if (childrenId && childrenSlot) {
                        const startX = ((rectL.left + rectL.width) + rectR.left) / 2;
                        for (const childId of childrenId) {
                            const nodeC = layout.nodeFromId(childId)!;
                            const rectC = getNodeRect(nodeC);
                            plotElbowHorizontal(drawing,
                                startX, slotY,
                                getSlotY(rectL, childrenSlot),
                                rectC.left + rectC.width / 2, rectC.top
                            ).addClass("family-tree-connection family-tree-connection-child");
                        }
                    }
                } else {
                    console.assert(node1.row < node2.row);
                    const nodeU = node1;
                    const nodeD = node2;
                    const rectU = nodeU === nodeL ? rectL : rectR;
                    const rectD = nodeD === nodeL ? rectL : rectR;
                    const slotYU = getSlotY(rectU, slot1);
                    const edgeXL = rectL.left + rectL.width + FAMILY_TREE_MATE_SLOT_OFFSET;
                    const edgeYL = rectL.top + rectL.height / 2;
                    const edgeXR = rectR.left - FAMILY_TREE_MATE_SLOT_OFFSET;
                    const edgeYR = rectR.top + rectR.height / 2;
                    drawing.polyline([
                        rectL.left + rectL.width, edgeYL,
                        edgeXL, edgeYL,
                        edgeXL, slotYU,
                        edgeXR, slotYU,
                        edgeXR, edgeYR,
                        rectR.left, edgeYR
                    ]).addClass("family-tree-connection family-tree-connection-mate");
                    if (childrenId && childrenSlot) {
                        const startX = nodeD === nodeL
                            ? rectL.left + rectL.width + FAMILY_TREE_MATE_SLOT_OFFSET / 2
                            : rectR.left - FAMILY_TREE_MATE_SLOT_OFFSET / 2;
                        for (const childId of childrenId) {
                            const nodeC = layout.nodeFromId(childId)!;
                            const rectC = getNodeRect(nodeC);
                            plotElbowHorizontal(drawing,
                                startX, rectD.top + rectD.height / 2,
                                getSlotY(rectD, childrenSlot),
                                rectC.left + rectC.width / 2, rectC.top
                            ).addClass("family-tree-connection family-tree-connection-child");
                        }
                    }
                }
            } else {
                // ISingleParentLayoutConnection
                const { id1, childrenSlot, childrenId } = connection;
                const node1 = layout.nodeFromId(id1);
                console.assert(node1, "Single parent node missing", id1);
                if (!node1) continue;
                const rect1 = getNodeRect(node1);
                if (childrenId && childrenSlot) {
                    for (const childId of childrenId) {
                        const nodeC = layout.nodeFromId(childId)!;
                        const rectC = getNodeRect(nodeC);
                        plotElbowHorizontal(drawing,
                            rect1.left + rect1.width / 2, rect1.top + rect1.height,
                            getSlotY(rect1, childrenSlot),
                            rectC.left + rectC.width / 2, rectC.top
                        ).addClass("family-tree-connection family-tree-connection-child");
                    }
                }
            }
        }
        this.forceUpdate();
    }
    private _onDrawingRootChanged = (root: HTMLDivElement | null): void => {
        this._drawingRoot = root;
        this._updateDrawing();
    }
    public scrollToNode(id: string): boolean {
        const container = this._idContainerMap.get(id);
        if (!container) return false;
        container.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        return true;
    }
    public render(): React.ReactNode {
        const mergedComponent = this._portalNodes.map(([container, reactRoot]) => ReactDOM.createPortal(reactRoot, container));
        if (this._pendingOnRenderedCall) {
            this._pendingOnRenderedCall = false;
            if (this.props.onRendered) {
                window.setTimeout(() => {
                    window.requestAnimationFrame(() => {
                        this.props.onRendered && this.props.onRendered(this);
                    });
                });
            }
        }
        return (<div ref={this._onDrawingRootChanged} className={classNames("family-tree-drawing", this.props.className)}>{mergedComponent}</div>);
    }
    public componentDidUpdate(prevProps: IFamilyTreeProps) {
        if (prevProps.familyTree !== this.props.familyTree) {
            this._updateDrawing();
        }
    }
}

function plotElbowHorizontal(container: Svg.Container, x1: number, y1: number, y2: number, x3: number, y3: number): Svg.PolyLine {
    return container
        .polyline([x1, y1, x1, y2, x3, y2, x3, y3]);
}

// function plotElbowVertical(container: Svg.Container, x1: number, y1: number, x2: number, x3: number, y3: number): Svg.PolyLine {
//     return container
//         .polyline([x1, y1, x2, y1, x2, y3, x3, y3]);
// }

export function dumpFamilyTreeData(data: IFamilyTreeData): string {
    function getLabelFor(qName: RdfQName): string {
        return (dataService.getLabelFor(qName) || {}).label || qName;
    }
    const result: IFamilyTreeData = {
        roots: data.roots.map(v => getLabelFor(v)),
        mates: data.mates.map(([v1, v2]) => [getLabelFor(v1), getLabelFor(v2)]),
        children: data.children.map(([p1, p2, c]) => [getLabelFor(p1), p2 && getLabelFor(p2), getLabelFor(c)])
    };
    return JSON.stringify(result);
}

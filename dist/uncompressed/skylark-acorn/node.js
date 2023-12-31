define([
    './state',
    './locutil'
], function (m_state, m_locutil) {
    'use strict';
    const {Parser} = m_state;
    const {SourceLocation} = m_locutil;
    class Node {
        constructor(parser, pos, loc) {
            this.type = '';
            this.start = pos;
            this.end = 0;
            if (parser.options.locations)
                this.loc = new SourceLocation(parser, loc);
            if (parser.options.directSourceFile)
                this.sourceFile = parser.options.directSourceFile;
            if (parser.options.ranges)
                this.range = [
                    pos,
                    0
                ];
        }
    }
    const pp = Parser.prototype;
    pp.startNode = function () {
        return new Node(this, this.start, this.startLoc);
    };
    pp.startNodeAt = function (pos, loc) {
        return new Node(this, pos, loc);
    };
    function finishNodeAt(node, type, pos, loc) {
        node.type = type;
        node.end = pos;
        if (this.options.locations)
            node.loc.end = loc;
        if (this.options.ranges)
            node.range[1] = pos;
        return node;
    }
    pp.finishNode = function (node, type) {
        return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
    };
    pp.finishNodeAt = function (node, type, pos, loc) {
        return finishNodeAt.call(this, node, type, pos, loc);
    };
    pp.copyNode = function (node) {
        let newNode = new Node(this, node.start, this.startLoc);
        for (let prop in node)
            newNode[prop] = node[prop];
        return newNode;
    };
    return { Node: Node };
});
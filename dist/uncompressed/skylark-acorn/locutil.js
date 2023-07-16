define(['./whitespace'], function (m_whitespace) {
    'use strict';
    const {nextLineBreak} = m_whitespace;
    class Position {
        constructor(line, col) {
            this.line = line;
            this.column = col;
        }
        offset(n) {
            return new Position(this.line, this.column + n);
        }
    }
    class SourceLocation {
        constructor(p, start, end) {
            this.start = start;
            this.end = end;
            if (p.sourceFile !== null)
                this.source = p.sourceFile;
        }
    }
    function getLineInfo(input, offset) {
        for (let line = 1, cur = 0;;) {
            let nextBreak = nextLineBreak(input, cur, offset);
            if (nextBreak < 0)
                return new Position(line, offset - cur);
            ++line;
            cur = nextBreak;
        }
    }
    return {
        Position: Position,
        SourceLocation: SourceLocation,
        getLineInfo: getLineInfo
    };
});
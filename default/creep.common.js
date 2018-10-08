'use strict';

Creep.prototype.moveToVisualized = function (target) {
    return this.moveTo(target, {
        visualizePathStyle: {
            stroke: '#ffaa00'
        },
        reusePath: 10,
    });
};

Creep.prototype.moveToCenter = function () {
    this.moveToVisualized(new RoomPosition(25, 25, this.room.name));
};

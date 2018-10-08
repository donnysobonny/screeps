'use strict';

StructureLink.prototype.update = function () {
    if(this.room.inLink && this.memory.type == "out") {
        this.transferEnergy(this.room.inLink);
    }
};
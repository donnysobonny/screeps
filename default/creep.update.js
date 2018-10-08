'use strict';

Creep.prototype.update = function () {
    switch (this.memory.type) {
        case "worker":
            this.updateWorker();
            break;
        case "manual":
            //controlled manually
            break;
        default:
            this.stopJob();
            break;
    }
};

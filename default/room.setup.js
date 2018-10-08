'use strict';

/**
 * All structures in the room
 *
 * @type {Array<string, Structure>}
 */
Room.prototype.structures = {};
/**
 * All containers in the room
 *
 * @type {Array<string, StructureContainer>}
 */
Room.prototype.containers = {};
/**
 * All spawns in the room
 *
 * @type {Array<string, StructureSpawn>}
 */
Room.prototype.spawns = {};
/**
 * All links in the room
 *
 * @type {Array<string, StructureLink>}
 */
Room.prototype.links = {};
/**
 * The room's input link, based on either the link closest to the build origin or to the center
 *
 * @type {StructureLink}
 */
Room.prototype.inLink = null;
/**
 * All extensions in the room
 *
 * @type {Array<string, StructureExtension>}
 */
Room.prototype.extensions = {};
/**
 * All towers in the room
 *
 * @type {Array<string, StructureTower>}
 */
Room.prototype.towers = {};
/**
 * All allied creeps in the room
 *
 * @type {Array<string, Creep>}
 */
Room.prototype.creeps = {};
/**
 * All enemy creeps in the room
 *
 * @type {Array<string, Creep>}
 */
Room.prototype.enemyCreeps = {};
Room.prototype.start = function () {
    if(!this.controller.my) {
        return;
    }

    this.structures = {};
    let objs = this.find(FIND_STRUCTURES);
    for(let i = 0; i < objs.length; i++) {
        this.structures[objs[i].id] = objs[i];
    }
    if(this.memory.structures == undefined) {
        this.memory.structures = {};
    }
    for(let k in this.structures) {
        if(this.memory.structures[k] == undefined) {
            this.memory.structures[k] = {};
        }
        this.structures[k].memory = this.memory.structures[k];
    }

    this.towers = {};
    objs = this.find(FIND_STRUCTURES, {
        filter: function (obj) {
            return obj.structureType == STRUCTURE_TOWER;
        }
    });
    for(let i = 0; i < objs.length; i++) {
        this.towers[objs[i].id] = objs[i];
    }

    this.containers = {};
    objs = this.find(FIND_STRUCTURES, {
        filter: function (obj) {
            return obj.structureType == STRUCTURE_CONTAINER;
        }
    });
    for(let i = 0; i < objs.length; i++) {
        this.containers[objs[i].id] = objs[i];
    }

    this.extensions = {};
    objs = this.find(FIND_STRUCTURES, {
        filter: function (obj) {
            return obj.structureType == STRUCTURE_EXTENSION;
        }
    });
    for(let i = 0; i < objs.length; i++) {
        this.extensions[objs[i].id] = objs[i];
    }

    this.creeps = {};
    objs = this.find(FIND_MY_CREEPS);
    for(let i = 0; i < objs.length; i++) {
        this.creeps[objs[i].name] = objs[i];
    }

    this.enemyCreeps = {};
    objs = this.find(FIND_HOSTILE_CREEPS);
    for(let i = 0; i < objs.length; i++) {
        this.enemyCreeps[objs[i].name] = objs[i];
    }

    this.spawns = {};
    objs = this.find(FIND_MY_SPAWNS);
    for(let i = 0; i < objs.length; i++) {
        this.spawns[objs[i].id] = objs[i];
    }

    this.links = {};
    objs = this.find(FIND_STRUCTURES, {
        filter: function (obj) {
            return obj.structureType == STRUCTURE_LINK;
        }
    });
    for(let i = 0; i < objs.length; i++) {
        this.links[objs[i].id] = objs[i];
    }

    if(this.memory.sourceSpaceCount === undefined) {
        //determine the number of spaces around sources
        const sources = this.find(FIND_SOURCES);
        this.memory.sourceSpaceCount = 0;
        this.memory.sourceSpaces = [];
        for(let i = 0; i < sources.length; i++) {
            const t = this.getTerrain();
            if(t.get(sources[i].pos.x - 1, sources[i].pos.y) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x - 1,
                    y: sources[i].pos.y
                });
            }
            if(t.get(sources[i].pos.x + 1, sources[i].pos.y) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x + 1,
                    y: sources[i].pos.y
                });
            }
            if(t.get(sources[i].pos.x, sources[i].pos.y + 1) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x,
                    y: sources[i].pos.y + 1
                });
            }
            if(t.get(sources[i].pos.x, sources[i].pos.y - 1) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x,
                    y: sources[i].pos.y - 1
                });
            }
            if(t.get(sources[i].pos.x + 1, sources[i].pos.y + 1) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x + 1,
                    y: sources[i].pos.y + 1
                });
            }
            if(t.get(sources[i].pos.x + 1, sources[i].pos.y - 1) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x + 1,
                    y: sources[i].pos.y - 1
                });
            }
            if(t.get(sources[i].pos.x - 1, sources[i].pos.y + 1) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x - 1,
                    y: sources[i].pos.y + 1
                });
            }
            if(t.get(sources[i].pos.x - 1, sources[i].pos.y - 1) != 1) {
                this.memory.sourceSpaceCount++;
                this.memory.sourceSpaces.push({
                    id: sources[i].id,
                    x: sources[i].pos.x - 1,
                    y: sources[i].pos.y - 1
                });
            }
        }
    }
    if(this.memory.spawnMultiplier === undefined) {
        this.memory.spawnMultiplier = 1.2;
    }
    if(this.memory.energyPercentageForSpawning === undefined) {
        this.memory.energyPercentageForSpawning = 0.8;
    }
    if(this.memory.claimController == undefined) {
        this.memory.claimController = "";
    }
    if(this.memory.buildContructionSite == undefined) {
        this.memory.buildContructionSite = "";
    }

    for(let k in this.creeps) {
        this.creeps[k].start();
    }

    this.inLink = null;
    if(this.memory.autoBuildOrigin != undefined) {
        this.inLink = this.getPositionAt(this.memory.autoBuildOrigin.x, this.memory.autoBuildOrigin.y).findClosestByRange(FIND_STRUCTURES, {
            filter: (o) => {
                return o.structureType == STRUCTURE_LINK
            }
        });
    } else {
        this.inLink = this.getPositionAt(25, 25).findClosestByRange(FIND_STRUCTURES, {
            filter: (o) => {
                return o.structureType == STRUCTURE_LINK
            }
        });
    }
    for(let k in this.links) {
        if(this.inLink && k == this.inLink.id) {
            this.links[k].memory.type = "in";
        } else {
            this.links[k].memory.type = "out";
        }
    }
};
Room.prototype.end = function () {
    if(!this.controller.my) {
        return;
    }

    for(let k in this.structures) {
        this.memory.structures[k] = this.structures[k].memory;
    }
    for(let k in this.memory.structures) {
        if(this.structures[k] == undefined) {
            delete (this.memory.structures[k]);
        }
    }
};

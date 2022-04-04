function CItem_Equip(iIndex, sClass, sSlot) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IUsers/GLoadout", {
                method: "POST",
                data: {
                    class: sClass,
                    index: iIndex,
                    slot: sSlot
                }
            })
            .then(d => {
                if (d.result == "SUCCESS") {
                    rs(d);
                } else {
                    rj(d);
                }
            })
            .catch(rj);
    });
}

function CItem_Use(iItem, iTarget) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IEconomyItems/GManageItem", {
                method: "POST",
                data: {
                    item_id: iItem,
                    target: iTarget
                }
            })
            .then(d => {
                if (d.result == "SUCCESS") {
                    rs(d);
                } else {
                    rj(d);
                }
            })
            .catch(rj);
    });
}

function CItem_Delete(iIndex) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send('/api/IEconomyItems/GManageItem', {
                method: "DELETE",
                data: {
                    item_id: iIndex
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CItem_Scrap(iIndex) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send('/api/IEconomyItems/GManageItem', {
                method: "DELETE",
                data: {
                    action: "scrap",
                    item_id: iIndex
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CItem_Move(iIndex, iSlot) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send("/api/IEconomyItems/GMoveItem", {
                method: "POST",
                data: {
                    item_id: iIndex,
                    slot_id: iSlot
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CItem_RestoreAttribute(iIndex, sAttribute) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send("/api/IEconomyItems/GManageItem", {
                method: "PATCH",
                data: {
                    action: "restore_attribute",
                    item_id: iIndex,
                    attribute: sAttribute
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CItem_RestoreCounters(iIndex) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send("/api/IEconomyItems/GManageItem", {
                method: "PATCH",
                data: {
                    action: "restore_counters",
                    item_id: iIndex
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CItem_RestoreKillstreak(iIndex) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send("/api/IEconomyItems/GManageItem", {
                method: "PATCH",
                data: {
                    action: "restore_killstreak",
                    item_id: iIndex
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CItem_EquipGlobal(iIndex, sSlot) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IUsers/GLoadout", {
                method: "POST",
                data: {
                    class: "general",
                    index: iIndex,
                    slot: sSlot
                }
            })
            .then(d => {
                if (d.result == "SUCCESS") {
                    rs(d);
                } else {
                    rj(d);
                }
            })
            .catch(rj);
    });
}

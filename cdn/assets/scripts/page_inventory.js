function CInventory_ButtonDeleteItem(index) {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: "Are you sure you want to delete this item? This action can not be undone."
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "We're deleting this item."
            });

            CItem_Delete(index)
                .then(d => {
                    if (d.result == "SUCCESS") {

                        let iSlot = Inventory.slots.find(s => !!s.item && s.item.id == index);
                        if (!!iSlot) iSlot.clearItem();
                        CInventory_ParseOverflows(d.overflows);

                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "Your item was successfully deleted."
                            });
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `${d.error.code} - ${d.error.title}`,
                            innerText: d.error.content
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CInventory_ButtonScrapItem(index, value) {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to scrap this item for <b>${value} <i class='mdi mdi-currency-usd-circle-outline'></i></b>? This action can not be undone.`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "We're scrapping this item."
            });

            CItem_Scrap(index)
                .then(d => {
                    if (d.result == "SUCCESS") {

                        let iSlot = Inventory.slots.find(s => !!s.item && s.item.id == index);
                        if (!!iSlot) iSlot.clearItem();
                        CInventory_ParseOverflows(d.overflows);

                        (async () => {
                            await Preview_ShowNewItems();
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `${d.error.code} - ${d.error.title}`,
                            innerText: d.error.content
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CInventory_GetSelectedItems() {
    let list = [];
    for (let slot of Inventory.slots) {
        if (slot.selected) {
            list.push(slot.item.id);
            slot.clearItem();
        }
    }
    return list;
}

function CInventory_GetSelectedScrapValue() {
    let iValue = 0;
    for (let slot of Inventory.slots) {
        if (slot.selected) {
            iValue += (+slot.item.DOM2.getAttribute("data-scrap"))
        }
    }
    return iValue;
}

function CInventory_ButtonBulkDelete() {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: "Are you sure you want to delete multiple items at once? This action can not be undone."
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "We're deleting these items."
            });

            CItem_BulkDelete(CInventory_GetSelectedItems())
                .then(d => {
                    if (d.result == "SUCCESS") {
                        CInventory_ParseOverflows(d.overflows);

                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "Your items were successfully deleted."
                            });
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `${d.error.code} - ${d.error.title}`,
                            innerText: d.error.content
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CInventory_ButtonBulkScrap() {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to scrap multiple items at once for <b>${CInventory_GetSelectedScrapValue()} <i class='mdi mdi-currency-usd-circle-outline'></i></b>? This action can not be undone.`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "We're deleting these items."
            });

            CItem_BulkScrap(CInventory_GetSelectedItems())
                .then(d => {
                    if (d.result == "SUCCESS") {
                        CInventory_ParseOverflows(d.overflows);

                        (async () => {
                            await Preview_ShowNewItems();
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `${d.error.code} - ${d.error.title}`,
                            innerText: d.error.content
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CItem_ButtonEquip(el, index, sClass, slot) {
    return new Promise(async (rs, rj) => {
        el.classList.add("loading");
        let d = await CItem_Equip(index, sClass, slot);
        document.location.href = d.url;
        rs();
    });
}

function CItem_ButtonUse(el, index, target) {
    return new Promise(async (rs, rj) => {
        el.classList.add("loading");
        document.location.href = `/items/use/${index}/${target}`;
        rs();
    });
}

function CItem_ButtonUseConfirm(index, target) {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to use these items? This action can not be undone.`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "Please wait."
            });

            CItem_Use(index, target)
                .then(d => {
                    if (d.result == "SUCCESS") {

                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "Your items were successfully used."
                            });
                            document.location.href = "/my/inventory";
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `${d.error.code} - ${d.error.title}`,
                            innerText: d.error.content
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CItem_ButtonUseLootbox(lootbox) {
    return new Promise(async (rs, rj) => {
        Creators.Actions.Modals.progress({
            name: "Processing...",
            innerText: "Please wait."
        });

        CItem_Use(lootbox)
            .then(d => {
                if (d.result == "SUCCESS") {
                    Preview_ShowLootboxLoot()
                        .then(() => {
                            document.location.href = "/my/inventory";
                            rs();
                        });
                } else {
                    Creators.Actions.Modals.error({
                        name: `Error ${d.error.code}`,
                        innerText: d.error.title
                    });
                    rj(d);
                }
            });
    });
}

function CInventory_ButtonRestoreAttributeConfirm(index, name, item_name, display) {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to restore <b>${display}</b> from <b>${item_name}</b>. This attribute will be restored and the items used to apply it <b>will not be returned.</b>`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "Please wait."
            });

            CItem_RestoreAttribute(index, name)
                .then(d => {
                    if (d.result == "SUCCESS") {

                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "This attribute has been successful restored."
                            });
                            document.location.href = "/my/inventory";
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `Error ${d.error.code}`,
                            innerText: d.error.title
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CInventory_ButtonRestoreCountersConfirm(index, item_name) {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to reset all strange counters on <b>${item_name}</b>. This will reset all counters back to <b>0</b>.<br/>This action <b>cannot be undone</b>.</b>`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "Please wait."
            });

            CItem_RestoreCounters(index)
                .then(d => {
                    if (d.result == "SUCCESS") {

                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "All counters were successfully reset."
                            });
                            document.location.href = "/my/inventory";
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `Error ${d.error.code}`,
                            innerText: d.error.title
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CInventory_ButtonRestoreKillstreakConfirm(index, item_name) {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to reset all killstreak effects on <b>${item_name}</b>. This will disable killstreak counter and will remove all the effects.<br/>This action <b>cannot be undone</b>. You will not get the consumed Killstreak Kit in return.</b>`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "Please wait."
            });

            CItem_RestoreKillstreak(index)
                .then(d => {
                    if (d.result == "SUCCESS") {

                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "Killstreak effect has been removed."
                            });
                            document.location.href = "/my/inventory";
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `Error ${d.error.code}`,
                            innerText: d.error.title
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CInventory_ButtonEquipMusicKit(index) {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to equip this Music Kit?`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "Please wait."
            });

            CItem_EquipGlobal(index, "SOUNDTRACK")
                .then(d => {
                    if (d.result == "SUCCESS") {
                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "This Music Kit is successfully equipped."
                            });
                            document.location.href = "/my/inventory";
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `Error ${d.error.code}`,
                            innerText: d.error.title
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

function CInventory_ButtonUnequipMusicKit() {
    return new Promise(async (rs, rj) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: `Are you sure you want to unequip this Music Kit?`
            })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "Please wait."
            });

            CItem_EquipGlobal(0, "SOUNDTRACK")
                .then(d => {
                    if (d.result == "SUCCESS") {
                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "This Music Kit is successfully unequipped."
                            });
                            document.location.href = "/my/inventory";
                            rs(d);
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `Error ${d.error.code}`,
                            innerText: d.error.title
                        });
                        rj(d);
                    }
                });
        } else {
            rj();
        }
    });
}

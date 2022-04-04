(() => {
    Creators.Items = {
        instance: {}
    };
    Creators.Items.instance.use = async (index, target) => {
        if (await Creators.Actions.Modals.confirm({
                name: "Are you sure?",
                innerText: "Are you sure you want to use this item? This action cannot be undone!"
            })) {
            Creators.Actions.Modals.progress({
                name: "Please wait...",
                innerText: "Processing..."
            });
            Creators.Actions.API.send('/api/IEconomyItems/GManageItem', {
                    method: "POST",
                    data: {
                        item_id: (+index),
                        target: (+target)
                    }
                })
                .then(d => {
                    if (d.result == "SUCCESS") {
                        (async () => {
                            await Creators.Actions.Modals.alert({
                                name: "Success!",
                                innerText: "You have successfully used your item!"
                            });
                            document.location.href = '/my/inventory';
                        })();
                    } else {
                        Creators.Actions.Modals.error({
                            name: `${d.error.code} - ${d.error.title}`,
                            innerText: d.error.content
                        });
                    }
                });
        }
    };
    Creators.Items.instance.scrap = async (index, value) => {
        return new Promise(async (rs, rj) => {
            if (await Creators.Actions.Modals.confirm({
                    name: "Are you sure? - Scrapping",
                    innerText: `Are you sure you want to scrap this item for <b>${value} <i class='mdi mdi-currency-usd-circle-outline'></i></b>? This action cannot be undone!`
                })) {
                Creators.Actions.Modals.progress({
                    name: "Please wait...",
                    innerText: "Scrapping your item..."
                });
                CEItems_ForceScrapItem(index)
                    .then(d => {
                        if (d.result == "SUCCESS") {
                            (async () => {
                                await Creators.Actions.Modals.alert({
                                    name: "Success!",
                                    innerText: "Your item was successfully scrapped for <b>" + d.value + "</b> <i class='mdi mdi-currency-usd-circle-outline'></i>"
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
    };

    Creators.Items.instance.delete = (index) => {
        return new Promise(async (rs, rj) => {
            if (await Creators.Actions.Modals.confirm({
                    name: "Are you sure? - Deleting",
                    innerText: "Are you sure you want to delete this item? This action can not be undone."
                })) {
                Creators.Actions.Modals.progress({
                    name: "Processing...",
                    innerText: "We're deleting this item."
                });

                CEItems_ForceDeleteItem(index)
                    .then(d => {
                        if (d.result == "SUCCESS") {
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
    };

    Creators.Items.instance.equip = async (e, index, _class, slot) => {
        e.target.classList.add("loading");
        Creators.Actions.API.send("/api/IUsers/GLoadout", {
                method: "POST",
                data: {
                    class: _class,
                    index: index,
                    slot: slot
                }
            })
            .then(d => {
                if (d.result == "SUCCESS") {
                    document.location.href = d.url;
                } else {
                    Creators.Actions.Modals.error({
                        name: `${d.error.code} - ${d.error.title}`,
                        innerText: d.error.content
                    });
                }
            });
    }
})();

function CEItems_ForceDeleteItem(index) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send('/api/IEconomyItems/GManageItem', {
                method: "DELETE",
                data: {
                    item_id: (+index)
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CEItems_ForceBulkDeleteItems(array) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send('/api/IEconomyItems/GBulkInventory', {
                method: "DELETE",
                data: {
                    items: array
                }
            })
            .then(re)
            .catch(rj)
    });
}

function CEItems_ForceScrapItem(index) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send('/api/IEconomyItems/GManageItem', {
                method: "PATCH",
                data: {
                    item_id: (+index)
                }
            })
            .then(re)
            .catch(rj)
    });
}


function CEItems_ForceBulkScrapItems(array) {
    return new Promise((re, rj) => {
        Creators.Actions.API.send('/api/IEconomyItems/GBulkInventory', {
                method: "PATCH",
                data: {
                    items: array
                }
            })
            .then(re)
            .catch(rj)
    });
}

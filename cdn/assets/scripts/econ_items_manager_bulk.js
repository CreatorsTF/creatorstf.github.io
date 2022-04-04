function CItem_BulkDelete(array)
{
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

function CItem_BulkScrap(array)
{
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

function Quests_SetContract(contract) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IUsers/GContracker", {
                data: {
                    action: "activate",
                    contract: contract
                },
                method: "POST"
            })
            .then(rs)
            .catch(rj);
    });
}

function CEContracker_TurnInContract(contract) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IUsers/GContracker", {
                data: {
                    action: "turnin",
                    contract: contract
                },
                method: "POST"
            })
            .then(rs)
            .catch(rj);
    });
}

async function Provider_SetMemberRole_FromInput(input, provider, id)
{
    if(id == g_CreatorsUser.id)
    {
        if(await Creators.Actions.Modals.danger_confirm({
            name: "Are you sure?",
            innerText: "You are changing your own role, you may not be able to revert this change. Are you sure?"
        }) === false) {
            return;
        }
    }

    let sNewRole = input.options[input.selectedIndex].value;

    if(!["owner", "admin", "member"].includes(sNewRole))
    {
        return Creators.Actions.Modals.error({
            name: "Uh oh",
            innerText: "Invalid role type."
        })
    }

    for(let i in input.options)
    {
        let option = input.options[i];
        if(option.hasAttributes("selected"))
        {
            input.selectedIndex = i;
            break;
        }
    }

    input.parentElement.classList.add("loading");
    input.setAttribute("disabled", true);

    Provider_SetMemberRole(provider, id, sNewRole)
    .then(data => {
        if(data.result == "SUCCESS")
        {
            document.location.href = document.location.href;
        } else {
            input.parentElement.classList.remove("loading");
            input.removeAttribute("disabled");

            Creators.Actions.Modals.error({
                name: `Error`,
                innerText: data.error.title
            });
        }
    });
}

function Provider_SetMemberRole(provider, user, role)
{
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IProvider/GSetMemberRole", {
                method: "POST",
                data: {
                    user_id: user,
                    role: role,
                    provider_id: provider
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

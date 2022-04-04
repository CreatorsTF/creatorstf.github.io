const PREVIEW_MESSAGE_NULL = -1;
const PREVIEW_MESSAGE_FOUND = 0;
const PREVIEW_MESSAGE_REWARD = 1;
const PREVIEW_MESSAGE_PURCHASED = 2;
const PREVIEW_MESSAGE_DISTRIBUTED = 3;
const PREVIEW_MESSAGE_ITEM_UPGRADED = 4;

const ITEM_LOOTBOX_OPEN_SOUND = SOUND_BASE + "/ui/pickup/item_open_crate_short.wav";
const ITEM_LOOTBOX_LOOT_PRESENT = SOUND_BASE + "/ui/item_loot_present.wav";

let m_iItemPreviewsCount = -1;
let m_iCurrentItemIndex = -1;

function Preview_ShowNewItems()
{
    return new Promise(rs => {
        Creators.Actions.API.send("/api/IEconomyItems/GPreview", {
            data: {
                show: "new_items"
            }
        }).then(async e => {
            if(e.count > 0)
            {
                m_iCurrentItemIndex = -1;
                m_iItemPreviewsCount = e.count;
                await Creators.Actions.Modals.alert({
                    name: "New Items",
                    innerHTML: e.html,

                    width: "790px",
                    height: "548px",

                    content_only: true,
                    onready: () => {
                        Preview_DisplayPreview(0);
                    }
                });
            }
            rs();
        });
    });
}


function Preview_ShowLootboxLoot()
{
    return new Promise(rs => {
        Creators.Actions.API.send("/api/IEconomyItems/GPreview", {
            data: {
                show: "lootbox_loot"
            }
        }).then(async e => {
            if(e.count > 0)
            {
                m_iCurrentItemIndex = -1;
                m_iItemPreviewsCount = e.count;
                await Creators.Actions.Modals.alert({
                    innerHTML: e.html,

                    width: "790px",
                    height: "548px",

                    content_only: true,
                    onready: () => {
                        Preview_DisplayPreview(0);
                    }
                });
            }
            rs();
        });
    });
}

function Preview_ShowNextItem()
{
    if(m_iCurrentItemIndex >= (m_iItemPreviewsCount - 1)) return;
    Preview_DisplayPreview(m_iCurrentItemIndex + 1);
}

function Preview_ShowPrevItem()
{
    if(m_iCurrentItemIndex <= 0) return;
    Preview_DisplayPreview(m_iCurrentItemIndex - 1);
}

function Preview_DisplayPreview(index)
{
    let bIsLootboxLoot = document.querySelector(".new_items_wrapper.lootbox_loot") !== null;

    m_iCurrentItemIndex = index;
    for(let el of document.querySelectorAll(".modal_preview_wrapper"))
    {
        if(el.getAttribute("data-index") == (index + 1))
        {
            el.classList.add("active");
            setTimeout(() => {
                el.classList.add("seen");
            }, 3500);
        }
        else el.classList.remove("active");
    }
    document.querySelector("#new_item_index").innerText = index + 1;

    if(bIsLootboxLoot)
    {
        if(!document.querySelector(".modal_preview_wrapper.active").classList.contains("seen"))
        {
            Creators.Actions.Sounds.play(ITEM_LOOTBOX_OPEN_SOUND);
            setTimeout(() => {
                Creators.Actions.Sounds.play(ITEM_LOOTBOX_LOOT_PRESENT);
            }, 3100);
        }
    }

    if(index > 0)
    {
        document.querySelector(".tf-button.btn_prev_item").classList.remove("hidden");
    } else {
        document.querySelector(".tf-button.btn_prev_item").classList.add("hidden");
    }

    if(index < (m_iItemPreviewsCount - 1))
    {
        document.querySelector(".tf-button.btn_next_item").classList.remove("hidden");
        document.querySelector(".tf-button.btn_backpack").classList.add("hidden");
    } else {
        document.querySelector(".tf-button.btn_next_item").classList.add("hidden");
        document.querySelector(".tf-button.btn_backpack").classList.remove("hidden");
    }
}

function Preview_ShowSpecificItem(index, message = PREVIEW_MESSAGE_NULL) {
    return new Promise(rs => {
        Creators.Actions.Modals.progress({
            name: "Loading..."
        });
        Creators.Actions.API.send("/api/IEconomyItems/GPreview", {
            data: {
                items: [index],
                message: message
            }
        }).then(async e => {
            await Creators.Actions.Modals.alert({
                name: "New Items",
                innerHTML: e.previews[0],

                width: "790px",
                height: "548px",

                content_only: true
            });
            rs();
        });
    });
}

class CTFInventory {
    constructor(data) {
        this.DOM = document.querySelector(data.selector);
        this.DOMGrid = this.DOM.querySelector(".itemsgrid");
        this.DOMPages = this.DOM.querySelector(".inv-pagination");

        this.items_per_page = data.items_per_page;

        this.loading = false;
        this.stopped = false;
        this.cursor = 0;

        this.slots = [];
        this.items = [];
        this.pages = [];
        this.overflow = [];

        this.currentPage = -1;
        this.currentItem = null;

        this.inSearch = false;
        this.searchStringValue = null;

        this.loadSkeleton();
    }

    async sort(type) {
        Creators.Actions.Modals.progress({
            name: "Sorting...",
            innerText: "We're sorting your items."
        });
        await Creators.Actions.API.send('/api/IUsers/GSortBackpack', {
            method: "PATCH",
            data: {
                item_id: (+index)
            }
        })
        Creators.Actions.Modals.close();
    }

    updateOverflow() {
        let iSection = document.querySelector("#inventory_section_overflow");
        let iSlot = document.querySelector("#inventory_overflow_slot");
        let iDeleteButton = document.querySelector("#inventory_overflow_delete");

        if (this.overflow.length == 0) iSection.classList.remove("active");
        else {
            let iItem = this.overflow[0];
            iSection.classList.add("active");
            iDeleteButton.onclick = () => {
                Creators.Items.instance.delete(iItem.id)
                    .then(r => {
                        this.overflow = this.overflow.filter(i => i.id !== iItem.id);
                        this.updateOverflow();
                    })

            }

            iSlot.innerHTML = '';
            iSlot.append(iItem.DOM);

            if (!iItem.loaded) {
                Creators.Actions.API.send('/api/IEconomyItems/GBulkInventory', {
                    data: {
                        items: iItem.id,
                        profile: Creators_Inventory_Profile
                    }
                })
                    .then(data => {
                        if (data.result == "SUCCESS") {
                            iItem.load(data.items[0]);
                        }
                    });
            }
        }
    }

    updateSelected() {
        let iSelectedSlots = this.slots.filter(s => s.selected);
        let iSelected = iSelectedSlots.length;
        if (iSelected > 0) {
            document.querySelector("#inventory_label_counter").innerText = iSelected;
            document.querySelector("#inventory_section_selected").classList.add("active");
        } else {
            document.querySelector("#inventory_section_selected").classList.remove("active");
        }
        let iCanDelete = true;
        let iCanScrap = true;
        for (let a of iSelectedSlots)
            if (a.item.DOM2.getAttribute("data-can_delete") != "true") {
                iCanDelete = false;
                break;
            }

        for (let a of iSelectedSlots)
            if (a.item.DOM2.getAttribute("data-can_scrap") != "true") {
                iCanScrap = false;
                break;
            }

        document.querySelector("#inventory_button_delete").style.display = iCanDelete ? null : "none";
        document.querySelector("#inventory_button_scrap").style.display = iCanScrap ? null : "none";
    }

    desellectSelected() {
        for (let slot of this.slots) {
            if (slot.selected) slot.toggleSelect(false);
        }
    }

    selectPage() {
        let iPage = this.pages[this.currentPage];
        for (let slot of iPage.slots) {
            if (!!slot.item) slot.toggleSelect(true);
        }
    }

    async deleteSelected() {
        if (await Creators.Actions.Modals.confirm({
            name: "Are you sure?",
            innerText: "You are about to delete multiple items at once. Are you really sure?"
        })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "We're deleting selected items."
            });

            let list = [];
            for (let slot of this.slots) {
                if (slot.selected) {
                    list.push(slot.item.id);
                    slot.clearItem();
                }
            }
            let data = await CEItems_ForceBulkDeleteItems(list);
            CInventory_ParseOverflows(data.overflows);

            Creators.Actions.Modals.alert({
                name: "Success!",
                innerText: "All selected items were deleted."
            });
        }
    }

    async scrapSelected() {
        let iScrapValue = 0;
        for (let slot of this.slots) {
            if (slot.selected) {
                iScrapValue += (+slot.item.DOM2.getAttribute("data-scrap"));
            }
        }
        if (await Creators.Actions.Modals.confirm({
            name: "Are you sure?",
            innerText: `You are about to scrap multiple items at once. You will get <b>${iScrapValue} <i class='mdi mdi-currency-usd-circle-outline'></i></b> in return. Are you really sure?`
        })) {
            Creators.Actions.Modals.progress({
                name: "Processing...",
                innerText: "We're scrapping selected items."
            });

            let list = [];
            for (let slot of this.slots) {
                if (slot.selected) {
                    list.push(slot.item.id);
                    slot.clearItem();
                }
            }
            let data = await CEItems_ForceBulkScrapItems(list);
            CInventory_ParseOverflows(data.overflows);

            Creators.Actions.Modals.alert({
                name: "Success!",
                innerText: `All selected items were scrapped. <b>${iScrapValue} <i class='mdi mdi-currency-usd-circle-outline'></i></b> was successfully added to your balance.`
            });
        }
    }

    renderSlots(slots) {
        for (let a of (this.pages || [])) {
            a.delete();
        }
        this.pages = [];

        for (let i = 0; i < slots.length; i += this.items_per_page) {
            let page = new CTFInventoryPage();
            this.pages.push(page);
            for (let j = 0; j < this.items_per_page; j++) {
                if (i + j >= slots.length) break;
                page.slots.push(slots[i + j]);
                page.DOM.append(slots[i + j].DOM);
            }
            this.DOMGrid.append(page.DOM);
        }
        this.renderPageButtons(0);
        let pageNum = Number.parseInt(localStorage.inventoryPage) || 0;
        this.currentPage = pageNum;
        this.openPage(pageNum);
    }

    renderPageButtons(page) {
        this.DOMPages.innerHTML = '';
        for (let [i, v] of this.pages.entries()) {
            this.DOMPages.append((() => {
                let a = document.createElement("div");
                a.className = "tf-button click_dragging";
                if (i == page)
                    a.classList.add("selected");
                a.innerText = i + 1;
                a.index = i;
                if (v.slots.filter(s => !!s.item).length == 0) a.classList.add("no_items");
                a.onclick = () => {
                    this.openPage.call(this, i);
                };
                return a;
            })());
        }
    }

    searchString(el) {
        let iValue = el.value.trim();
        if (iValue == null || iValue == "") {
            this.inSearch = false;
            this.renderSlots(this.slots);
        } else {
            this.inSearch = true;
        }
        if (this.searchStringValue == iValue) return;
        this.searchStringValue = iValue;

        let query = this.searchStringValue.toLowerCase();
        let result = [];

        for (let a of this.slots) {
            if (!a.hasItem()) continue;
            if ((a.item.name || "").toLowerCase().includes(query)) {
                result.push(a);
            } else if ((a.item.description || "").toLowerCase().includes(query)) {
                result.push(a);
            } else {
                for (let b of a.item.attributes) {
                    if (b.value.toLowerCase().includes(query)) {
                        result.push(a);
                        break;
                    }
                }
            }
        }
        this.renderSlots(result);
        this.openPage(0);
    }

    async loadSkeleton() {
        return new Promise(async (re, rj) => {
            this.slots = [];
            this.overflow = [];
            let iSlots = Creators_Inventory_Pages * this.items_per_page;
            for (let i = 0; i < iSlots; i++)
                this.slots.push(new CTFSlot(i));

            let g_bStop = false;
            let g_iCursor = 0;
            while (!g_bStop) {
                await Creators.Actions.API.send('/api/IUsers/GInventorySkeleton', {
                    data: {
                        limit: 500,
                        cursor: g_iCursor,
                        profile: Creators_Inventory_Profile
                    }
                })
                    .then(data => {
                        if (data.cursor == null) g_bStop = true;
                        else g_iCursor = data.cursor;

                        console.log(data.items)

                        for (let a of data.items) {
                            let xSlot = this.slots.find((s) => {
                                return s.id == a.slot
                            });
                            if (xSlot) {
                                if (!xSlot.item) {
                                    xSlot.mountItem(new CTFItem(a, {
                                        checkbox: Creators_Inventory_bIsOwner
                                    }));
                                }
                            }
                        }
                        for (let a of data.overflow) {
                            this.overflow.push(new CTFItem(a, {
                                checkbox: false
                            }));
                        }
                        if (this.overflow.length > 0)
                            this.updateOverflow();
                    })
                    .catch(data => {
                        g_bStop = true;
                    })
            }
            this.DOMGrid.classList.remove("loading");
            if (this.slots.filter(s => !!s.item).length == 0) {
                document.querySelector(".inv-noitems").style.display = null;
                document.querySelector(".itemsgrid").style.display = "none";
            }

            this.renderSlots(this.slots);
            re();
        });
    }

    nextPage() {
        if (this.currentPage == (this.pages.length - 1)) this.currentPage = -1;
        this.openPage(this.currentPage + 1);
    }

    prevPage() {
        if (this.currentPage == 0) this.currentPage = this.pages.length;
        this.openPage(this.currentPage - 1);
    }

    openPage(page) {
        if (!this.pages[page]) return;
        for (let a of this.pages) a.hide();
        for (let a of document.querySelectorAll(".inv-pagination .tf-button")) {
            if (a.index != page) a.classList.remove("selected");
            else a.classList.add("selected");
        }
        this.currentPage = page;
        this.pages[page].show();

        localStorage.inventoryPage = this.currentPage;
    }
}

class CTFInventoryPage {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.object = this;
        this.DOM.className = "inv-page";
        this.DOM.style.display = "none";
        this.loaded = false;
        this.slots = [];
    }

    delete() {
        this.DOM.remove();
    }

    load() {
        let list = [];
        for (let a of this.slots) {
            if (!a.item || a.item.loaded) continue;
            list.push(a.item.id);
        }
        if (list.length > 0) {
            // do something here to load the page.
        }
    }

    show() {
        this.DOM.style.display = null;
        this.load();
    }

    hide() {
        this.DOM.style.display = "none";
    }
}


class CTFSlot {
    constructor(id) {
        this.contains_item = false;
        this.id = id;
        this.item = null;
        this.selected = false;

        this.DOM = document.createElement('div');
        this.DOM.object = this;
        this.DOM.className = 'backpack-slot';
    }

    hasItem() {
        return this.item !== null;
    }

    loadItem(a) {
        if (!this.hasItem()) return;
        this.item.load(a);
        this.mountItem(this.item);
    }

    toggleSelect(select) {
        if (!!this.item && this.item.checkbox) this.item.DOMCheckbox.checked = select;
        this.selected = select;
        if (select)
            this.DOM.classList.add("selected");
        else
            this.DOM.classList.remove("selected");

        Inventory.updateSelected();
    }

    mountItem(item) {
        this.toggleSelect(false);
        this.item = item;
        this.item.lastSlot = this;
        this.DOM.innerHTML = '';
        this.DOM.appendChild(this.item.DOM);
        if (!this.item.loaded) {
            this.DOM.classList.add("loading");
        } else {
            this.DOM.classList.add("has_item");
            this.DOM.classList.remove("loading");
        }
    }

    clearItem() {
        this.toggleSelect(false);
        this.item = null;
        this.DOM.innerHTML = '';
        this.DOM.style.background = null;
        this.DOM.classList.remove("loading");
        this.DOM.classList.remove("has_item");
    }
}

class CTFDraggingItem {
    constructor(item, e) {
        this.item = item;
        this.DOM = document.createElement("div");
        this.DOM.object = this;
        this.DOM.className = "item";
        this.DOM.style.backgroundColor = 'transparent';
        this.DOM.style.backgroundImage = `url(${item.image}?width=90)`;
        this.DOM.style.backgroundSize = `80%`;
        this.DOM.style.backgroundPosition = `center`;
        this.DOM.style.backgroundRepeat = `no-repeat`;
        this.DOM.style.position = "absolute";
        this.DOM.style.border = "none";
        this.DOM.style.pointerEvents = "none";
        this.DOM.style.transform = "translate(-45px, -45px)";

        this.posX = e.pageX;
        this.posY = e.pageY;

        this.candidateSlot = null;
    }

    move(e) {
        if (!this.DOM) return;
        this.DOM.style.left = `${e.clientX + window.scrollX}px`;
        this.DOM.style.top = `${e.clientY + window.scrollY}px`;
    }
}

class CTFItem {
    constructor(data, options = {}) {
        this.loaded = true;

        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.attributes = data.attributes || [];
        this.image = data.image;
        this.checkbox = options.checkbox === true;
        this.sounds = data.sounds;

        this.lastSlot = null;
        this.dragElement = null;

        this.DOM = document.createElement("div");
        this.DOM.object = this;
        this.DOM.style.width = "100%";
        this.DOM.style.height = "100%";

        this.DOM.innerHTML = data.html;
        this.DOM2 = this.DOM.children[0];
        this.DOM2.object = this;

        if (this.checkbox === true) {
            this.addCheckbox();
        }
    }

    addCheckbox() {
        this.DOMCheckbox = document.createElement("input");
        this.DOMCheckbox.setAttribute("type", "checkbox");
        this.DOM.appendChild(this.DOMCheckbox);

        this.DOMCheckbox.addEventListener('change', (e) => {
            this.lastSlot.toggleSelect(e.target.checked);
        });
    }

    removeCheckbox() {
        if (this.DOMCheckbox) {
            this.DOMCheckbox.remove();
        }
    }
}

let g_DraggedElement;
let g_ActiveElement;

document.addEventListener("mouseover", (e) => {
    if (e.target.classList.contains("click_dragging") && !!g_DraggedElement) {
        e.target.__clickInterval = setInterval(() => {
            var evObj = document.createEvent('Events');
            evObj.initEvent("click", true, false);
            e.target.dispatchEvent(evObj);
        }, 550);
    }
    if (e.target.object instanceof CTFSlot && !e.target.object.item && !!g_DraggedElement) {
        e.target.classList.add("highlight");
    }
});

document.addEventListener("mouseout", (e) => {
    if (e.target.classList.contains("click_dragging")) {
        clearInterval(e.target.__clickInterval);
    }
    if (e.target.object instanceof CTFSlot && !e.target.object.item && !!g_DraggedElement) {
        e.target.classList.remove("highlight");
    }
});

document.addEventListener("mousedown", (e) => {
    if (e.target.object instanceof CTFItem && g_ActiveElement == null && g_DraggedElement == null && Creators_Inventory_bIsOwner) {
        g_ActiveElement = e.target.object;
    }
}, false);

function onInventoryPickup(e) {
    if (e.target.object instanceof CTFItem && e.target.object.lastSlot) {
        for (let a of document.querySelectorAll(".tooltip__element"))
            a.remove();

        e.target.object.lastSlot.clearItem();
        e.target.object.dragElement = new CTFDraggingItem(e.target.object, e);
        clearOverlay(e.target);
        TOOLTIPS_DISABLE();

        g_DraggedElement = e.target.object.dragElement;
        document.body.appendChild(g_DraggedElement.DOM);
        g_DraggedElement.move(e);

        for (let a of document.querySelectorAll(".inventory-nav-arrow"))
            a.classList.add('highlight');

        Creators.Actions.Sounds.play(e.target.object.sounds.drag_pickup);
    }
}

function onInventoryDrag(e) {
    g_DraggedElement.move(e);
}

document.addEventListener("mousemove", (e) => {
    // Base case: active element must actually exist.
    if (!g_ActiveElement) return;

    if (!g_DraggedElement) {
        onInventoryPickup(e)
    } else {
        onInventoryDrag(e)
    }


}, false);

document.addEventListener("mouseup", (e) => {
    if (!!g_ActiveElement)
        g_ActiveElement = null;
    if (!!g_DraggedElement) {
        let iTarget = document.elementFromPoint(e.clientX, e.clientY);

        if (!!iTarget.__clickInterval)
            clearInterval(iTarget.__clickInterval);

        TOOLTIPS_ENABLE();
        if (iTarget.object instanceof CTFItem) {
            let iLastSlot = g_DraggedElement.item.lastSlot;
            iTarget.object.lastSlot.mountItem(g_DraggedElement.item);
            iLastSlot.mountItem(iTarget.object);
        } else if (iTarget.object instanceof CTFSlot) {
            iTarget.object.mountItem(g_DraggedElement.item);
            iTarget.classList.remove("highlight");
        } else {
            g_DraggedElement.item.lastSlot.DOM.classList.remove("highlight");
            g_DraggedElement.item.lastSlot.mountItem(g_DraggedElement.item);
        }
        Inventory.renderPageButtons(Inventory.currentPage);
        Creators.Actions.API.send("/api/IEconomyItems/GMoveItem", {
            method: "POST",
            data: {
                item_id: g_DraggedElement.item.id,
                slot_id: g_DraggedElement.item.lastSlot.id
            }
        });

        Creators.Actions.Sounds.play(g_DraggedElement.item.sounds.drag_drop);
        g_DraggedElement.DOM.remove();
        g_DraggedElement = null;

        for (let a of document.querySelectorAll(".click_dragging")) {
            a.classList.remove('highlight');
            clearInterval(a.__clickInterval);
        }
    }
}, false);


let Inventory = new CTFInventory({
    selector: "#inventory-main",
    items_per_page: 48
});

function CInventory_ParseOverflows(array) {
    for (let i of array) {
        let iItem = Inventory.overflow.find(s => s.id == i.id);
        let iOFSlot = Inventory.slots.find(s => s.id == i.slot);
        if (!!iOFSlot) {
            iItem.addCheckbox();
            iOFSlot.mountItem(iItem);
            Inventory.overflow = Inventory.overflow.filter(s => s.id != i.id);
        }
    }
    Inventory.updateOverflow();
    Inventory.openPage(Inventory.currentPage);
}

function CInventory_DeleteItem(item_index) {
    CItem_Delete(item_index)
        .then(d => {
            let iSlot = Inventory.slots.find(s => !!s.item && s.item.id == item_index);
            if (!!iSlot) iSlot.clearItem();
            CInventory_ParseOverflows(d.overflows);
        })
        .catch(() => {
        })
}

function CInventory_ScrapItem(item_index, scrap_amount) {
    CItem_Scrap(item_index)
        .then(d => {
            let iSlot = Inventory.slots.find(s => !!s.item && s.item.id == item_index);
            if (!!iSlot) iSlot.clearItem();
            CInventory_ParseOverflows(d.overflows);
        })
        .catch(() => {
        })
}

async function CInventory_SortInventory(sort_type) {
    return new Promise((re, rj) => {
        Creators.Actions.Modals.progress({
            name: "Sorting your backpack...",
            innerText: "Please hold on..."
        });

        Creators.Actions.API.send("/api/IUsers/GSortBackpack", {
            method: "POST",
            data: {
                type: sort_type
            }
        })
            .then(d => {
                Inventory.loadSkeleton()
                    .then(r => {
                        Creators.Actions.Modals.close();
                    });
                re(d);
            })
            .catch(rj)
    })
}

if (Creators_Inventory_bIsOwner) {
    document.querySelector("#inventory_sort_select").addEventListener("change", (e) => {
        let iType = e.target.options[e.target.selectedIndex].value;
        CInventory_SortInventory(iType);
    });
}

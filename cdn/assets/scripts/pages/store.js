const STORE_SOUND_CLICK = SOUND_BASE + "ui/buttonclickrelease.wav";
Creators.Actions.Sounds.precache(STORE_SOUND_CLICK);


class CTFStore {
    constructor(data) {
        this.DOM = document.querySelector(data.selector);
        this.DOMGrid = this.DOM.querySelector("#itemsgrid");
        this.DOMPages = this.DOM.querySelector("#store_pages");

        this.m_iItemsPerPage = data.items_per_page;

        this.items = [];
        this.pages = [];
        this.cart = [];

        this.m_iCurrentPage = -1;

        this.m_sFilterType = "all";
        this.m_sFilterClass = "all";
        this.m_sFilterSearch = null;
        this.m_bFilterFeature = false;

        this.m_bIsCheckoutOpen = false;

        this.loadSkeleton();
    }

    renderItems(slots) {
        for (let a of (this.pages || [])) {
            a.delete();
        }
        this.pages = [];
        slots = slots.filter(this.getFilterFN());

        for (let i = 0; i < slots.length; i += this.m_iItemsPerPage) {
            let page = new CTFStorePage();
            this.pages.push(page);
            for (let j = 0; j < this.m_iItemsPerPage; j++) {
                if (i + j >= slots.length) break;
                page.items.push(slots[i + j]);
                page.DOM.append(slots[i + j].DOM);
            }
            this.DOMGrid.append(page.DOM);
        }
        this.m_iCurrentPage = -1;
        this.openPage(0);
        this.updateCartNumber();
    }

    renderPageButtons(page) {
        this.DOMPages.innerText = `${this.m_iCurrentPage+1}/${this.pages.length}`;
    }

    updateCartNumber() {
        this.DOM.querySelector("#store_cart_items").innerText = this.cart.length;
    }

    updateBalanceNumber() {
        this.DOM.querySelector("#store_balance").innerText = Creators_Store_Balance;
    }

    addIndexToCart(index) {
        if (this.cart.length >= Creators_Store_Checkout_Max) return;

        this.cart.push(index);
        this.updateCartNumber();
        this.DOM.querySelector("#store_cart_items").parentElement.classList.add("cart-animation");
        clearTimeout(this.__timeout);
        this.__timeout = setTimeout(() => {
            this.DOM.querySelector("#store_cart_items").parentElement.classList.remove("cart-animation");
        }, 800);
    }

    removeIndexFromCart(index) {
        let iIndex = this.cart.indexOf(index);
        if (iIndex === -1) return;
        this.cart.splice(iIndex, 1);
        this.updateCartNumber();
    }

    showCartEffect(image, x, y) {
        let iImage = document.createElement("img");
        iImage.src = `${image}?width=90`;
        iImage.style.transformOrigin = `${-x+20}px ${-y}px`;
        iImage.style.width = `128px`;
        iImage.style.maxWidth = `128px`;
        iImage.style.height = `128px`;
        iImage.style.left = `${x}px`;
        iImage.style.top = `${y}px`;
        iImage.style.position = 'absolute';
        iImage.style.pointerEvents = 'none';
        iImage.style.zIndex = 40;
        document.querySelector("#store_checkout_race").appendChild(iImage);

        iImage.animate([{
                transform: 'scale(1)'
            },
            {
                transform: 'scale(0)'
            }
        ], {
            duration: 400
        });

        setTimeout(() => {
            iImage.remove()
        }, 390);
    }

    groupCart() {
        let counts = [];
        for (let a of this.cart) {
            let b = counts.find(c => c.id == a);
            if (!!b) b.count++;
            else counts.push({
                id: a,
                count: 1
            });
        }
        return counts;
    }

    getCartPrice() {
        if (this.cart.length == 0) return 0;
        return this.cart.map(a => {
            let iItem = this.items.find(b => b.id == a);
            if (!!iItem) return iItem.price;
            return 0;
        }).reduce((a, b) => a + b);
    }

    openCheckoutPage() {
        if (this.cart.length == 0) {
            Creators.Actions.Modals.alert({
                name: "Your cart is empty!",
                innerText: "Browse the catalog and add items you wish to purchase to the cart."
            })
            return;
        } else {
            this.m_bIsCheckoutOpen = true;
            Creators.Actions.Modals.alert({
                name: "Checkout",
                style: 'display: flex; flex-direction: column; overflow-y: initial',
                innerHTML: `
                <div style="flex: 1; overflow-y: auto">
                <div class="flex" style="padding: .5rem 0; border-bottom: 3px double #333; margin-bottom: .5rem;"> 
					<div class="p-l-10" style="width: calc(64px + 66%);"><label>ITEM</label></div>
                    <div class="noshrink m-l-5" style="width: 2.5rem;"><label><abbr title="Quantity">QT.</abbr></label></div>
                    <div class="noshrink"><label>PRICE</label></div>
                    <div class="noshrink store-checkout-remove p-l-5"></div>
                </div>
                ${this.groupCart().map((a) => {
                    let iItem = this.items.find(i => i.id == a.id);
                    return `
                    <div class="flex" data-count="${a.count}" data-price="${iItem.price}">
                        <div class="noshrink">
                            <img src="${iItem.image}" style="width: 64px" alt="">
                        </div>
                        <div class="store-checkout-name p-l-10 store-checkout-text white" style="width: 66%; color: #FFD700">${iItem.name}</div>
                        <div class="noshrink store-checkout-text m-l-5">&times; <span id="listing_count">${a.count}</span></div>
                        <div class="noshrink store-checkout-price store-checkout-text">
                            <span id="listing_price">${iItem.price * a.count}</span> <i class="mdi mdi-currency-usd-circle-outline"></i>
                        </div>
                        <div class="noshrink store-checkout-remove p-l-5">
                            <div class="tf-button" ignore onclick="CStore_CheckoutRemoveIndex(this, ${a.id})"><label>x</label></div>
                        </div>
                    </div>`;
                }).join("")}
                </div>
                <div class="flex m-t-10" style="border-top: 4px double #666; justify-content: space-between; margin: 0; padding: .5rem 1rem 2rem;">
                        <h2 class="m-0" style="margin-right: 2rem">TOTAL</h2>
                        <h1 class="m-0" style="font-size: 3rem">
                            <i class="mdi mdi-currency-usd-circle-outline"></i> <span id="checkout_total_price">${this.getCartPrice()}</span>
                        </h1>
                </div>
                `,
                width: "800px",
                height: "480px",
                buttons: [
                    {
                        value: "Cancel",
                        class: "tf-button2 secondary",
                        onclick: () => {
                        }
                    },
                    {
                        value: "Purchase",
                        icon: 'cart',
                        onclick: () => {
                            if (Creators_Store_Balance < this.getCartPrice())
                                Creators.Actions.Modals.error({
                                    name: "Not enough Mann Coins.",
                                    innerText: "You can get more coins by completing contracts and progressing through campaigns."
                                })
                            else {
                                Creators.Actions.Modals.progress({
                                    name: "Hold on...",
                                    innerText: "We're processing your order..."
                                });
                                Creators.Actions.API.send("/api/IEconomyItems/GStore", {
                                    method: "POST",
                                    data: {
                                        cart: this.cart
                                    }
                                })
                                    .then((e) => {
                                        if (e.result == "SUCCESS") {
                                            Preview_ShowNewItems();

                                            Creators_Store_Balance -= this.getCartPrice();
                                            this.cart = [];
                                            this.updateCartNumber();
                                            this.updateBalanceNumber();

                                        } else {
                                            Creators.Actions.Modals.error({
                                                name: "An error happened!",
                                                innerText: e.error.title
                                            });
                                        }
                                        })
                                }
                            }
                        },
                    ]
                })
               .then(() => {
                    this.m_bIsCheckoutOpen = false;
                });
        }
    }

    setSort(params) {
        // TODO(Johnny): Unimplemented, Sept. 2nd
    }

    setFilters(params) {
        if (params["feature"] != null)
            this.m_bFilterFeature = params["feature"];
        if (params["class"] != null)
            this.m_sFilterClass = params["class"];
        if (params["type"] != null)
            this.m_sFilterType = params["type"];
        if (params["search"] !== null)
            this.m_sFilterSearch = params["search"];

        this.renderItems(this.items);
    }

    getFilterFN() {
        return (e) => {
            if (this.m_bFilterFeature == true)
                if (e.feature == false) return false;

            if (this.m_sFilterClass != null && this.m_sFilterClass != "all")
                if (!e.classes.includes(this.m_sFilterClass)) return false;

            if (this.m_sFilterType != null && this.m_sFilterType != "all")
                if (e.type != this.m_sFilterType) return false;

            if (this.m_sFilterSearch != null && this.m_sFilterSearch != "") {
                if (!(
                        (e.name || "").toLowerCase().includes(this.m_sFilterSearch) ||
                        (e.description || "").toLowerCase().includes(this.m_sFilterSearch) ||
                        (() => {
                            for (let b of (e.attributes || [])) {
                                if (b.value.toLowerCase().includes(this.m_sFilterSearch)) {
                                    return true;
                                }
                            }
                            return false;
                        })()
                    )) return false;
            }
            return true;
        }
    }

    async loadSkeleton() {
        return new Promise(async (re, rj) => {
            this.items = [];

            await Creators.Actions.API.send('/api/IEconomyItems/GStore?get=listings', {})
                .then(data => {
                    for (let a of data.listings) {
                        if (a.name == " ") continue;
                        this.items.push(new CTFListing(a));
                    }
                });

            this.DOMGrid.classList.remove("loading");
            this.renderItems(this.items);
            re();
        });
    }

    nextPage() {
        if (this.m_iCurrentPage == (this.pages.length - 1)) this.m_iCurrentPage = -1;
        this.openPage(this.m_iCurrentPage + 1);
    }

    prevPage() {
        if (this.m_iCurrentPage == 0) this.m_iCurrentPage = this.pages.length;
        this.openPage(this.m_iCurrentPage - 1);
    }

    openPage(page) {
        if (!this.pages[page]) return;
        for (let a of this.pages) a.hide();
        for (let a of document.querySelectorAll(".inv-pagination .tf-button")) {
            if (a.index != page) a.classList.remove("selected");
            else a.classList.add("selected");
        }
        this.m_iCurrentPage = page;
        this.pages[page].show();
        this.renderPageButtons(0);
    }
}

class CTFStorePage {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.object = this;
        this.DOM.className = "store-page";
        this.DOM.style.display = "none";
        this.loaded = false;
        this.items = [];
    }

    delete() {
        this.DOM.remove();
    }

    load() {
        let list = [];
        for (let a of this.items) {
            if (!a.item || a.item.loaded) continue;
            list.push(a.item);
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

class CTFListing {
    constructor(data, options = {}) {

        this.id = data.id;
        this.name = data.name;
        this.image = data.image;
        this.classes = data.classes;
        this.feature = data.feature;
        this.type = data.type;
        this.price = data.price;

        this.DOM = document.createElement("div");
        this.DOM.object = this;

        this.DOM.innerHTML = data.html;
        this.DOM2 = this.DOM.children[0].children[0];
        this.DOM2.object = this;
    }
}

Creators.Store = new CTFStore({
    selector: "#store-main",
    items_per_page: 15
});

function CStore_NextPage() {
    Creators.Actions.Sounds.play(STORE_SOUND_CLICK);
    Creators.Store.nextPage();
}

function CStore_PrevPage() {
    Creators.Actions.Sounds.play(STORE_SOUND_CLICK);
    Creators.Store.prevPage();
}

function CStore_NestedChangeActive(el) {
    for (let a of el.parentElement.children)
        a.classList.remove("active");

    el.classList.add("active");
}

function CStore_SelectChangeType(el) {
    Creators.Store.setFilters({
        type: el.options[el.selectedIndex].value
    })
}

function CStore_SelectChangeSort(el) {
    Creators.Store.setSort({
        type: el.options[el.selectedIndex].value
    })
}

function CStore_AddElementToCart(el) {
    if (Creators.Store.cart.length >= Creators_Store_Checkout_Max) {
        Creators.Actions.Modals.alert({
            name: "Checkout Limit",
            innerText: `You can only have up to ${Creators_Store_Checkout_Max} items in your cart.`
        });
        return;
    }

    // Creators.Actions.Sounds.play(el.dataset.sfxPickup);
    let iCart = document.querySelector("#store_checkout_race");
    Creators.Store.addIndexToCart(el.object.id);
    Creators.Store.showCartEffect(el.object.image, offset(el).left - offset(iCart).left, offset(el).top - offset(iCart).top - 20);
}

function offset(el) {
    var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft
    }
}

function CStore_CheckoutRemoveIndex(el, index) {
    let iRoot = el.parentElement.parentElement;
    let iPrice = iRoot.getAttribute("data-price");
    let iCount = iRoot.getAttribute("data-count");

    Creators.Store.removeIndexFromCart(index);
    iCount--;
    if (iCount == 0) {
        iRoot.remove();
    } else {
        iRoot.querySelector("#listing_price").innerText = iPrice * iCount;
        iRoot.querySelector("#listing_count").innerText = iCount;
        iRoot.setAttribute("data-count", iCount);

    }
    if (Creators.Store.cart.length == 0)
        Creators.Actions.Modals.close();
    else CStore_CheckoutUpdateTotal();
}

function CStore_CheckoutUpdateTotal() {
    let a = document.querySelector("#checkout_total_price");
    if (a) {
        a.innerText = Creators.Store.getCartPrice();
    }
}

class CTFHallOfFameController {
  constructor(data) {
    this.selector = data.selector;
    this.offset = 0;

    this.loading = false;
    this.stopped = false;

    this.DOM = document.querySelector(this.selector);

    this.loadNextMonth();

    window.addEventListener("scroll", (e) => {
      if(this.loading || this.stopped) return;
      if (window.scrollY + window.innerHeight + 600 > this.DOM.offsetTop + this.DOM.offsetHeight) {
        this.loadNextMonth();
      }
    })
  }

  loadNextMonth() {
    if (!this.loading && !this.stopped) {
      this.loading = true;
      let month = new CTFHallOfFameMonth({
        offset: this.offset
      });
      this.DOM.appendChild(month.DOM);
      month.init()
        .then((r) => {
          this.loading = false;
          this.offset++;
          if (r.result != "SUCCESS") this.stopped = true;
        })
        .catch(() => {
          this.loading = false;
          this.stopped = true;
        });
    }
  }
}
class CTFHallOfFameMonth {
  constructor(data) {
    this.offset = data.offset || 0;
    this.time = data.time
    this.DOM = document.createElement("div");
    this.DOM.object = this;
    this.DOM.className = 'haf-month flex loading';
    this.DOM.innerHTML = `
      <div class="haf-month-name"></div>
      <div class="haf-donators-list">
      </div>
    `;

  }

  init() {
    return new Promise((rs, rj) => {
      Creators.Actions.API.send('/api/IDonations/GDonationsList', {
          data: {
            offset: this.offset,
            ajax: 1
          }
        })
        .then((data) => {
          this.DOM.classList.remove("loading");
          if (data.result == "SUCCESS") {
            this.DOM.querySelector(".haf-month-name").innerHTML = `
              ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][data.cursor.time.month-1]} ${data.cursor.time.year}<br/><b>&#36;${data.cursor.total/100}</b>`

            this.DOM.querySelector(".haf-donators-list").innerHTML = data.donors;
            rs(data);
          } else {
            this.DOM.remove();
            rj(data);
          };
        })
        .catch((data) => {
          this.DOM.classList.remove("loading");
          rj(data);
        })
    })
  }
}

class CTFHallOfFameDonor {
  constructor(data) {
    this.DOM = document.createElement("div");
    this.DOM.object = this;
    this.DOM.className = 'showcase_profile embed flex';
    this.DOM.innerHTML = `
      <div class="flex">
        <div class="avatar">
          <a href="/profiles/${data.steamid}"><img src="${data.avatar}"></a>
        </div>
        <div class="miniprofile-data">
          <h2>${data.name}</h2>
          <span>Donated <b>&#36;${data.cents_amount/100}</b></span>
        </div>
      </div>
    `;
  }
}

new CTFHallOfFameController({
  selector: "#mount_halloffame"
});

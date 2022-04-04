class CTFComments {
  constructor(data)
  {
    this.DOM = document.querySelector(data.selector);

    this.DOMMount = this.DOM.querySelector("#mount-comments");
    this.DOMSelect = this.DOM.querySelector("#comments_select_page");

    this.DOMSelect.onchange = (e)=>{
      this.loadPage(e.target.options[e.target.selectedIndex].value);
    }

    this.count = data.count;
    this.target = data.target;
    this.id = data.id;

    this.loaded = false;

    this.total_count = 0;
    this.page = 0;

    this.loadPage(this.page);
  }

  loadPage(index)
  {
    this.page = index;
    this.DOMMount.classList.add("loading");
    Creators.Actions.API.send('/api/IComments/GComments', {
      data: {
        target: this.target,
        id: this.id,
        count: this.count,
        offset: index,
        ajax: 1
      }
    })
    .then(e=>{
      this.DOMMount.classList.remove("loading");
      this.DOMMount.innerHTML = e.outer_html;

      this.total_count = e.total_count;
      this.total_pages = e.total_pages = Math.ceil(this.total_count / this.count);
      this.makeSelect();
    })
  }

  makeSelect()
  {
    let html = "";
    for(let i = 0; i < this.total_pages; i++)
    {
      html += `<option value="${i}" ${i == this.page ? "selected" : null}>${i+1}</option>`;
    }
    this.DOMSelect.innerHTML = html;
  }

  nextPage()
  {
    if(this.page < (this.total_pages-1))
    {
      this.page++;
      this.loadPage(this.page);
    }
  }

  prevPage()
  {
    if(this.page > 0)
    {
      this.page--;
      this.loadPage(this.page);
    }
  }

  delete(index)
  {
    Creators.Actions.API.send("/api/IComments/GComments", {
      data: {
        id: index
      },
      method: "DELETE"
    })
    .then(e=>{
      this.loadPage(this.page);
    })
  }

  hide(index)
  {
    Creators.Actions.API.send("/api/IComments/GBlackList", {
      method: "POST",
      data: {
        id: index,
        state: true
      }
    })
    .then(e=>{
      if(e.result == "SUCCESS")
        this.loadPage(this.page);
      else
        Creators.Actions.Modals.error({innerText: e.error.title});
    });
  }

  unhide(index)
  {
    Creators.Actions.API.send("/api/IComments/GBlackList", {
      method: "POST",
      data: {
        id: index,
        state: false
      }
    })
    .then(e=>{
      if(e.result == "SUCCESS")
        this.loadPage(this.page);
      else
        Creators.Actions.Modals.error({innerText: e.error.title});
    });
  }
}

function CComments_FormatingHelp()
{
  Creators.Actions.API.send("/api/IAjax/GFormattingHelp", {
    data: {
      spreadsheet: "comment"
    }
  })
  .then(e=>{
    if(e.result == "SUCCESS")
      Creators.Actions.Modals.alert({name: "Formatting Help", innerHTML: e.ajax});
  });
}

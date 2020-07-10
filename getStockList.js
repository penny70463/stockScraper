const puppeteer = require('puppeteer');
(
    async () => {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    await page.goto('https://www.tej.com.tw/webtej/doc/uid.htm')
    
    const content=await page.evaluate(()=>{
        const tables = document.querySelectorAll('table')
        const rawMarketList = tables[1].querySelectorAll('tbody tr td table tbody tr')
        const rawCounterList = tables[24].querySelectorAll('tbody tr td table tbody tr')
        
        let marketList = []
        let counterList = []
        //上市公司,使用正則取得公司代碼
        rawMarketList.forEach((elm,idx) => {
            elm.innerText.match(/[0-9]{4}/g).forEach(el => {
                marketList.push(el)
            })
        })

        //上櫃公司,使用正則取得公司代碼
        rawCounterList.forEach((elm,idx) => {
            elm.innerText.match(/[0-9]{4}/g).forEach(el => {
                counterList.push(el)
            })
        })
  
    return marketList.concat(counterList)
    })
    
      //生成json
    const fs = require('fs')
    
    fs.writeFile(
            `stockList.json`,
            JSON.stringify(content),
            ()=>{}
    )
    await browser.close();
    
    })();
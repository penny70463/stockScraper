const puppeteer = require('puppeteer');

(
async () => {
  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  const fs = require('fs')
  fs.readFile('./stockList.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }
    const stockList = JSON.parse(jsonString)
    let scrapList=stockList
    const finalInfo = []
   
    groupBy(scrapList);
       async function groupBy(list) {
         
         for(let i = 0;i<list.length;i++) {
           //每個請求間隔3秒
          await timeout(3000)
          await getStockDetail(list[i]).then(
            res => {
             
              let calRet = JSON.parse(JSON.stringify(res))
              let lastData = calRet.history[calRet.history.length-1]
              let last2Data = calRet.history[calRet.history.length-2]
              let closePrice = calRet.closePrice

              finalInfo.push({
                stock:list[i],
                name:lastData.name,
                lastMonth:lastData.month,
                lastHighPrice:lastData.highPrice,
                lastLowPrice:lastData.lowPrice,
                lastAverage:lastData.average,
                lastDealCount:lastData.dealCount,
                lastDealAmount:lastData.dealAmount,
                lastDealStock:lastData.dealStock,
                lastDealRatio:lastData.dealRatio,
                lastClosePrice:closePrice.lastMonthClose,
                last2Month:last2Data.month,
                last2HighPrice:last2Data.highPrice,
                last2LowPrice:last2Data.lowPrice,
                last2Average:last2Data.average,
                last2DealCount:last2Data.dealCount,
                last2DealAmount:last2Data.dealAmount,
                last2DealStock:last2Data.dealStock,
                last2DealRatio:last2Data.dealRatio,
                last2ClosePrice:closePrice.last2MonthClose,
              })
              
               
          }).catch(new Function())
         }
        
        if(finalInfo[0]) {
          fs.writeFile(
            'data.json',
            JSON.stringify(finalInfo),
            ()=>{}
        )
        }
          
       }
})
//月成交資訊
//https://www.twse.com.tw/exchangeReport/FMSRFK?response=html&date=20200531&stockNo=2330
//日成交資訊
//https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=html&date=20200201&stockNo=2330
 async function getStockDetail(stock) {
  //台灣證交所
  const browser1 = await puppeteer.launch({
    headless:true
    });
  const page1 = await browser1.newPage();
  await page1.goto(`https://www.twse.com.tw/exchangeReport/FMSRFK?response=html&date=20200610&stockNo=${stock}`)
    const history = await page1.evaluate(()=>{
        const detail= document.querySelectorAll('tbody tr')
        const stockHistory = []
        if(detail) {
          const name= document.querySelectorAll('div')
          detail.forEach(elm => {
          let td = elm.querySelectorAll('td')
          stockHistory.push({
            month:td[1].innerText,
            name:name[1].innerText,
            highPrice:td[2].innerText,
            lowPrice:td[3].innerText,
            average:td[4].innerText,
            dealCount:td[5].innerText,
            dealAmount:td[6].innerText,
            dealStock:td[7].innerText,
            dealRatio:td[8].innerText,
          })
          
        })
        }
        
        
        return stockHistory
      })
    
  await browser1.close();

  //月收盤價
  //EX: https://www.twse.com.tw/exchangeReport/STOCK_DAY_AVG?response=html&date=20200501&stockNo=2330

  const lastMonth = (new Date().getMonth() == 0 ? 12 : new Date().getMonth())
  const last2Month = new Date().getMonth() -1 == 0 ? 12 : new Date().getMonth()-1
  const year1 = lastMonth == 12 ? new Date().getFullYear()-1 : new Date().getFullYear()
  const year2 = (last2Month=== 12||lastMonth === 12) ? new Date().getFullYear()-1 : new Date().getFullYear()
  const closePrice = {lastMonthClose:await getMonthlyClosePrice(digit(lastMonth),year1),last2MonthClose:await getMonthlyClosePrice(digit(last2Month),year2)}
  function digit(val) {
    return val < 10 ? '0'+ val.toString() :val
  }

  async function getMonthlyClosePrice(month,year) {
    await timeout(3000)
    const browser3 = await puppeteer.launch({
      headless:true
      });
      const page3 = await browser3.newPage();
      await page3.goto(`https://www.twse.com.tw/exchangeReport/STOCK_DAY_AVG?response=html&date=${year}${month}01&stockNo=${stock}`)
      const closePrice = await page3.evaluate(()=>{
        const detail= document.querySelectorAll('tbody tr')
        if(detail) {
          return detail[detail.length-2].querySelectorAll('tr td')[1].innerText
        } else {
          return ''
        }
        
      })
    
      await browser3.close();
      return closePrice
    }
  return {history,closePrice}
  }
}
)();


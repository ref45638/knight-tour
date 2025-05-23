# knight-tour

## 線上試玩

您可以透過以下連結在線上試玩此遊戲：
[https://ref45638.github.io/knight-tour](https://ref45638.github.io/knight-tour)

## 專案簡介

這是一個騎士巡邏遊戲的網頁應用程式。玩家需要操控騎士在棋盤上移動，目標是走遍棋盤上的每一個格子且每個格子只能走一次。

## 功能特色

-   互動式棋盤界面
-   可選擇棋盤大小 (5x5, 6x6, 7x7)
-   手動遊玩模式，點擊棋盤格移動騎士
-   自動遊玩模式，使用 Warnsdorff 演算法進行演示 (從隨機位置開始)
-   多段速度自動模式：按一下開始正常速度，再按一下加速兩倍，再按一下加速三倍，再按一下停止並讓玩家繼續遊戲
-   復原 (Undo) 功能，可撤銷上一步移動
-   重新開始 (Reset) 功能，可隨時重新開始新局
-   視覺化提示：
    -   騎士目前位置 (以騎士圖示標示)
    -   已走過的格子 (並標示移動順序)
    -   起始格子
    -   下一步可走的格子
    -   標示每個可走下一步的後續可走步數 (Warnsdorff 策略提示)
-   遊戲開始前顯示遊戲規則說明
-   遊戲完成或無法繼續時的訊息提示
-   響應式網頁設計 (RWD)，適應不同裝置螢幕尺寸

## 如何執行/遊玩

1.  複製或下載此專案到您的本機電腦。
2.  使用網頁瀏覽器打開 `index.html` 檔案即可開始遊戲。

## 使用的技術

-   HTML
-   CSS
-   JavaScript
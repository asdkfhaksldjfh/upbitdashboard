/**
 * 코인 지표 대시보드 - Upbit API 통합
 */

const UPBIT_API_BASE = 'https://api.upbit.com/v1';

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>코인 지표 대시보드</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            margin-bottom: 20px;
        }

        h1 {
            color: #333;
            margin-bottom: 15px;
            font-size: 28px;
        }

        .controls {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }

        button {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        button.primary {
            background: #667eea;
            color: white;
        }

        button.primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        button.secondary {
            background: #e0e7ff;
            color: #667eea;
        }

        button.secondary:hover {
            background: #c7d2fe;
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .status {
            padding: 8px 15px;
            background: #f0f0f0;
            border-radius: 8px;
            font-size: 14px;
            color: #666;
        }

        .status.loading {
            background: #fef3c7;
            color: #92400e;
        }

        .status.error {
            background: #fee2e2;
            color: #991b1b;
        }

        .status.success {
            background: #d1fae5;
            color: #065f46;
        }

        .table-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            position: relative;
        }

        th:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        th.sortable::after {
            content: ' ⇅';
            opacity: 0.5;
        }

        th.sorted-asc::after {
            content: ' ↑';
            opacity: 1;
        }

        th.sorted-desc::after {
            content: ' ↓';
            opacity: 1;
        }

        tbody tr {
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.2s ease;
        }

        tbody tr:hover {
            background: #f9fafb;
        }

        td {
            padding: 15px;
        }

        .coin-name {
            font-weight: 600;
            color: #333;
        }

        .coin-code {
            font-size: 12px;
            color: #666;
            margin-top: 3px;
        }

        .positive {
            color: #059669;
            font-weight: 600;
        }

        .negative {
            color: #dc2626;
            font-weight: 600;
        }

        .rsi {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 5px;
            font-weight: 600;
            font-size: 13px;
        }

        .rsi.oversold {
            background: #dbeafe;
            color: #1e40af;
        }

        .rsi.overbought {
            background: #fee2e2;
            color: #991b1b;
        }

        .rsi.neutral {
            background: #f3f4f6;
            color: #4b5563;
        }

        .loading-row td {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .volume {
            font-family: 'Courier New', monospace;
        }

        .progress {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>코인 지표 대시보드</h1>
            <div class="controls">
                <button class="primary" id="refreshBtn" onclick="loadData()">데이터 새로고침</button>
                <button class="secondary" id="clearCacheBtn" onclick="clearCache()">캐시 삭제</button>
                <div class="status" id="status">준비됨</div>
                <div class="progress" id="progress"></div>
            </div>
        </header>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th class="sortable" onclick="sortTable('rank')">순위</th>
                        <th class="sortable" onclick="sortTable('name')">코인명</th>
                        <th class="sortable" onclick="sortTable('price')">현재가</th>
                        <th class="sortable" onclick="sortTable('change')">변화율</th>
                        <th class="sortable sorted-desc" onclick="sortTable('volume')">거래량 (24h)</th>
                        <th class="sortable" onclick="sortTable('rsi')">RSI (14)</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <tr class="loading-row">
                        <td colspan="6">
                            <div class="spinner"></div>
                            데이터를 불러오는 중...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let coinData = [];
        let currentSort = { column: 'volume', direction: 'desc' };
        let isLoading = false;

        const API_BASE = '/api';
        const CACHE_KEY = 'upbit_markets_cache';
        const CACHE_DURATION = 24 * 60 * 60 * 1000;
        const API_DELAY = 300;

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        function formatNumber(num) {
            if (num >= 1000000000) {
                return (num / 1000000000).toFixed(2) + 'B';
            } else if (num >= 1000000) {
                return (num / 1000000).toFixed(2) + 'M';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(2) + 'K';
            }
            return num.toFixed(2);
        }

        function formatPrice(price) {
            if (price >= 1000) {
                return price.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
            } else if (price >= 1) {
                return price.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
            } else {
                return price.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
            }
        }

        function calculateRSI(candles, period = 14) {
            if (candles.length < period + 1) return null;

            let gains = 0;
            let losses = 0;

            for (let i = 1; i <= period; i++) {
                const change = candles[i - 1].trade_price - candles[i].trade_price;
                if (change > 0) {
                    gains += change;
                } else {
                    losses += Math.abs(change);
                }
            }

            let avgGain = gains / period;
            let avgLoss = losses / period;

            for (let i = period + 1; i < candles.length; i++) {
                const change = candles[i - 1].trade_price - candles[i].trade_price;
                avgGain = ((avgGain * (period - 1)) + (change > 0 ? change : 0)) / period;
                avgLoss = ((avgLoss * (period - 1)) + (change < 0 ? Math.abs(change) : 0)) / period;
            }

            if (avgLoss === 0) return 100;
            const rs = avgGain / avgLoss;
            return 100 - (100 / (1 + rs));
        }

        async function getMarkets() {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    console.log('캐시된 마켓 데이터 사용');
                    return data.filter(m => m.market.startsWith('KRW-'));
                }
            }

            console.log('마켓 데이터 API 호출');
            const response = await fetch(\`\${API_BASE}/market/all\`);
            const data = await response.json();

            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            return data.filter(m => m.market.startsWith('KRW-'));
        }

        async function getCandles(market, count = 30) {
            await delay(API_DELAY);
            const response = await fetch(
                \`\${API_BASE}/candles/minutes/60?market=\${market}&count=\${count}\`
            );
            if (response.status === 429) {
                console.warn('Rate limit 도달, 재시도 대기 중...');
                await delay(1000);
                return getCandles(market, count);
            }
            return response.json();
        }

        async function getTickers(markets) {
            await delay(API_DELAY);
            const marketString = markets.join(',');
            const response = await fetch(
                \`\${API_BASE}/ticker?markets=\${marketString}\`
            );
            if (response.status === 429) {
                console.warn('Rate limit 도달, 재시도 대기 중...');
                await delay(1000);
                return getTickers(markets);
            }
            return response.json();
        }

        function updateStatus(message, type = 'info') {
            const statusEl = document.getElementById('status');
            statusEl.textContent = message;
            statusEl.className = \`status \${type}\`;
        }

        function updateProgress(current, total) {
            const progressEl = document.getElementById('progress');
            if (total > 0) {
                progressEl.textContent = \`진행: \${current}/\${total} (\${Math.round(current/total*100)}%)\`;
            } else {
                progressEl.textContent = '';
            }
        }

        async function loadData() {
            if (isLoading) {
                alert('이미 데이터를 불러오는 중입니다.');
                return;
            }

            isLoading = true;
            document.getElementById('refreshBtn').disabled = true;
            updateStatus('데이터 로딩 중...', 'loading');
            updateProgress(0, 0);

            try {
                updateStatus('마켓 목록 조회 중...', 'loading');
                const markets = await getMarkets();
                console.log(\`총 \${markets.length}개 마켓 발견\`);

                updateStatus('현재가 정보 조회 중...', 'loading');
                const marketCodes = markets.map(m => m.market);

                const batchSize = 100;
                let allTickers = [];
                for (let i = 0; i < marketCodes.length; i += batchSize) {
                    const batch = marketCodes.slice(i, i + batchSize);
                    const tickers = await getTickers(batch);
                    allTickers = allTickers.concat(tickers);
                    updateProgress(i + batch.length, marketCodes.length);
                }

                allTickers.sort((a, b) => b.acc_trade_price_24h - a.acc_trade_price_24h);
                const topTickers = allTickers.slice(0, 30);

                updateStatus('RSI 계산을 위한 데이터 수집 중...', 'loading');
                coinData = [];

                for (let i = 0; i < topTickers.length; i++) {
                    const ticker = topTickers[i];
                    updateProgress(i + 1, topTickers.length);

                    try {
                        const candles = await getCandles(ticker.market, 30);
                        const rsi = calculateRSI(candles);

                        const market = markets.find(m => m.market === ticker.market);

                        coinData.push({
                            rank: i + 1,
                            market: ticker.market,
                            name: market ? market.korean_name : ticker.market,
                            price: ticker.trade_price,
                            change: ticker.signed_change_rate * 100,
                            volume: ticker.acc_trade_price_24h,
                            rsi: rsi
                        });
                    } catch (error) {
                        console.error(\`\${ticker.market} 데이터 처리 실패:\`, error);
                    }
                }

                renderTable();
                updateStatus(\`\${coinData.length}개 코인 데이터 로드 완료\`, 'success');
                updateProgress(0, 0);

            } catch (error) {
                console.error('데이터 로드 실패:', error);
                updateStatus('데이터 로드 실패', 'error');
                document.getElementById('tableBody').innerHTML = \`
                    <tr class="loading-row">
                        <td colspan="6">데이터 로드에 실패했습니다. 잠시 후 다시 시도해주세요.</td>
                    </tr>
                \`;
            } finally {
                isLoading = false;
                document.getElementById('refreshBtn').disabled = false;
            }
        }

        function sortTable(column) {
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = column === 'volume' || column === 'rsi' ? 'desc' : 'asc';
            }

            coinData.sort((a, b) => {
                let aVal = a[column];
                let bVal = b[column];

                if (column === 'name') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (currentSort.direction === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });

            renderTable();
        }

        function renderTable() {
            const tbody = document.getElementById('tableBody');

            document.querySelectorAll('th').forEach(th => {
                th.className = 'sortable';
            });

            const sortedHeader = Array.from(document.querySelectorAll('th')).find(th => {
                const onclick = th.getAttribute('onclick');
                return onclick && onclick.includes(\`'\${currentSort.column}'\`);
            });

            if (sortedHeader) {
                sortedHeader.className = \`sortable sorted-\${currentSort.direction}\`;
            }

            tbody.innerHTML = coinData.map((coin, index) => {
                const changeClass = coin.change > 0 ? 'positive' : coin.change < 0 ? 'negative' : '';
                const changeSign = coin.change > 0 ? '+' : '';

                let rsiClass = 'neutral';
                if (coin.rsi !== null) {
                    if (coin.rsi < 30) rsiClass = 'oversold';
                    else if (coin.rsi > 70) rsiClass = 'overbought';
                }

                return \`
                    <tr>
                        <td>\${index + 1}</td>
                        <td>
                            <div class="coin-name">\${coin.name}</div>
                            <div class="coin-code">\${coin.market}</div>
                        </td>
                        <td>\${formatPrice(coin.price)} 원</td>
                        <td class="\${changeClass}">\${changeSign}\${coin.change.toFixed(2)}%</td>
                        <td class="volume">\${formatNumber(coin.volume)} 원</td>
                        <td>
                            \${coin.rsi !== null
                                ? \`<span class="rsi \${rsiClass}">\${coin.rsi.toFixed(2)}</span>\`
                                : '<span class="rsi neutral">N/A</span>'
                            }
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function clearCache() {
            localStorage.removeItem(CACHE_KEY);
            updateStatus('캐시가 삭제되었습니다.', 'success');
            setTimeout(() => {
                updateStatus('준비됨', 'info');
            }, 2000);
        }

        window.addEventListener('load', () => {
            loadData();
        });
    </script>
</body>
</html>`;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// HTML 페이지 반환
		if (url.pathname === '/') {
			return new Response(HTML_CONTENT, {
				headers: {
					'Content-Type': 'text/html; charset=utf-8',
				},
			});
		}

		// API 프록시
		if (url.pathname.startsWith('/api/')) {
			const apiPath = url.pathname.replace('/api/', '');
			const upbitUrl = `${UPBIT_API_BASE}/${apiPath}${url.search}`;

			try {
				const response = await fetch(upbitUrl, {
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				});

				const data = await response.json();

				return new Response(JSON.stringify(data), {
					status: response.status,
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': 'public, max-age=10',
					},
				});
			} catch (error) {
				return new Response(
					JSON.stringify({
						error: 'API 호출 실패',
						message: error instanceof Error ? error.message : 'Unknown error',
					}),
					{
						status: 500,
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);
			}
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

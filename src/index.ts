/**
 * Upbit API Proxy - CORS 우회를 위한 프록시 서버
 */

const UPBIT_API_BASE = 'https://api.upbit.com/v1';

// CORS 헤더
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// Preflight 요청 처리
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: corsHeaders,
			});
		}

		// GET 요청만 허용
		if (request.method !== 'GET') {
			return new Response('Method not allowed', {
				status: 405,
				headers: corsHeaders,
			});
		}

		// 라우팅
		if (url.pathname === '/') {
			return new Response('Upbit API Proxy Server - 코인 대시보드용', {
				headers: corsHeaders,
			});
		}

		// /api/* 경로를 Upbit API로 프록시
		if (url.pathname.startsWith('/api/')) {
			const apiPath = url.pathname.replace('/api/', '');
			const upbitUrl = `${UPBIT_API_BASE}/${apiPath}${url.search}`;

			try {
				console.log('Proxying to Upbit API:', upbitUrl);

				const response = await fetch(upbitUrl, {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
					},
				});

				// Upbit API 응답 가져오기
				const data = await response.json();

				return new Response(JSON.stringify(data), {
					status: response.status,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
						'Cache-Control': 'public, max-age=10', // 10초 캐싱
					},
				});
			} catch (error) {
				console.error('Proxy error:', error);

				return new Response(
					JSON.stringify({
						error: 'Proxy failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					}),
					{
						status: 500,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				);
			}
		}

		// 404
		return new Response('Not Found', {
			status: 404,
			headers: corsHeaders,
		});
	},
} satisfies ExportedHandler<Env>;

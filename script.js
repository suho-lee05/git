let USER_TOKEN = localStorage.getItem("USER_TOKEN") || "";

// ✅ 로그인 함수
async function login() {
    let USER_ID = document.getElementById("userId").value;
    let USER_PW = document.getElementById("userPw").value;

    if (!USER_ID || !USER_PW) {
        document.getElementById("status").innerText = "❌ 아이디와 비밀번호를 입력하세요!";
        return;
    }

    document.getElementById("status").innerText = "🔄 로그인 중...";

    try {
        let response = await fetch("https://library.konkuk.ac.kr/pyxis-api/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json;charset=UTF-8" },
            body: JSON.stringify({
                loginId: USER_ID,
                password: USER_PW,
                isFamilyLogin: false,
                isMobile: true
            })
        });

        let data = await response.json();

        if (data.success) {
            USER_TOKEN = data.data.accessToken;
            localStorage.setItem("USER_TOKEN", USER_TOKEN);
            document.getElementById("status").innerText = "✅ 로그인 성공!";
        } else {
            document.getElementById("status").innerText = "❌ 로그인 실패! 아이디 또는 비밀번호 확인 필요.";
        }
    } catch (error) {
        document.getElementById("status").innerText = "❌ 로그인 오류 발생!";
    }
}

// ✅ 좌석 조회 함수 (101, 102 동시에 검색)
async function checkSeat() {
    if (!USER_TOKEN) {
        document.getElementById("seatStatus").innerText = "❌ 로그인 후 사용하세요.";
        return;
    }

    let seatId = document.getElementById("seatId").value;
    if (!seatId) {
        document.getElementById("seatStatus").innerText = "❌ 좌석 번호를 입력하세요.";
        return;
    }

    document.getElementById("seatStatus").innerText = "🔄 좌석 정보 조회 중...";

    try {
        let ROOM_IDS = [101, 102]; // ✅ 동시에 조회할 RoomID 리스트
        let seatInfoList = [];

        // ✅ 두 개의 RoomID(101, 102)에서 동시에 조회
        await Promise.all(ROOM_IDS.map(async (ROOM_ID) => {
            let response = await fetch(`https://library.konkuk.ac.kr/pyxis-api/1/api/rooms/${ROOM_ID}/seats`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                    "pyxis-auth-token": USER_TOKEN
                }
            });

            let data = await response.json();

            if (data.success) {
                let seatInfo = data.data.list.find(seat => seat.code == seatId);
                if (seatInfo) {
                    seatInfoList.push({ ROOM_ID, seatInfo });
                }
            }
        }));

        // ✅ 검색 결과 출력
        if (seatInfoList.length === 0) {
            document.getElementById("seatStatus").innerText = `❌ 좌석 ${seatId} 정보를 찾을 수 없습니다.`;
            return;
        }

        let resultText = seatInfoList.map(({ ROOM_ID, seatInfo }) => {
            if (seatInfo.isOccupied) {
                let remainingMinutes = seatInfo.remainingTime;
                let remainingTime = remainingMinutes > 0
                    ? `${Math.floor(remainingMinutes / 60)}시간 ${remainingMinutes % 60}분 남음`
                    : "⏳ 시간 종료됨";

                return `❌ <b>Room ${ROOM_ID}:</b> 좌석 ${seatId} 사용 중 (남은 시간: ${remainingTime})`;
            } else {
                return `✅ <b>Room ${ROOM_ID}:</b> 좌석 ${seatId} 사용 가능!`;
            }
        }).join("<br>");

        document.getElementById("seatStatus").innerHTML = resultText;

    } catch (error) {
        document.getElementById("seatStatus").innerText = "❌ 좌석 조회 오류 발생!";
    }
}

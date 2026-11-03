import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/game.js',import.meta.url),'utf8');
test('điều khiển di động và nội dung học được kết nối',()=>{
 for(const id of ['joystickZone','joystickStick','mobileInteract','mobileMapBtn','closeMapBtn','reflectionInput','saveReflection']) assert.match(html,new RegExp(`id="${id}"`));
 for(const fn of ['setupJoystick()','resetStick()','loadReflection()','saveReflection()'])assert.ok(js.includes(fn));
 assert.match(js,/state\.stick\.x/);assert.match(js,/state\.stick\.y/);
 assert.match(html,/Dự đoán/);assert.match(html,/Nhật kí khoa học/);
});

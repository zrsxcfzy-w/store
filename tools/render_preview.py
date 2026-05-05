from PIL import Image, ImageDraw, ImageFont, ImageFilter


W, H = 1564, 901
img = Image.new("RGB", (W, H), "#151515")
draw = ImageDraw.Draw(img)


def font(size, bold=False):
    files = [
        "C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/simsun.ttc",
    ]
    for path in files:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


F8 = font(8)
F9 = font(9)
F10 = font(10)
F11 = font(11)
F12 = font(12)
F13 = font(13)
F14 = font(14, True)
F15 = font(15, True)
F16 = font(16, True)
F18 = font(18, True)
F23 = font(23, True)


def rr(box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)


def text(xy, value, f=F11, color="#222", anchor=None):
    draw.text(xy, value, font=f, fill=color, anchor=anchor)


def center(box, value, f=F11, color="#222"):
    x1, y1, x2, y2 = box
    draw.multiline_text(
        ((x1 + x2) / 2, (y1 + y2) / 2),
        value,
        font=f,
        fill=color,
        anchor="mm",
        align="center",
        spacing=1,
    )


def card(box, radius=10):
    x1, y1, x2, y2 = box
    rr((x1 + 3, y1 + 5, x2 + 3, y2 + 5), radius, "#e9e3dc")
    rr(box, radius, "#ffffff", "#eeeeee")


def pill(box, label, fill, color="#fff", f=F10, outline=None):
    rr(box, 7, fill, outline)
    center(box, label, f, color)


def phone(x, title, w=304, h=720, border="#cfcfcf", title_y=37):
    text((x + w / 2, title_y), title, F23, "#111", "mm")
    rr((x, 81, x + w, 802), 22, "#fffdf9", border, 1)
    text((x + 24, 101), "9:41", F8, "#111")
    text((x + w - 68, 101), "▮▮  ≋  ▰", F8, "#111")
    return x + 13, 120, w - 26


def tissue(cx, cy, scale=1.0):
    def s(v): return int(v * scale)
    rr((cx - s(44), cy + s(5), cx + s(48), cy + s(48)), s(8), "#e7d6b9")
    rr((cx - s(34), cy + s(14), cx + s(38), cy + s(42)), s(7), "#f1e6d2")
    draw.polygon([(cx - s(20), cy + s(12)), (cx - s(4), cy - s(48)), (cx + s(22), cy - s(22)), (cx + s(10), cy + s(12))], fill="#fbfbf7")
    draw.polygon([(cx + s(2), cy + s(12)), (cx + s(18), cy - s(44)), (cx + s(42), cy + s(8))], fill="#eeeeea")


def detergent(cx, cy, scale=1.0):
    def s(v): return int(v * scale)
    rr((cx - s(28), cy - s(8), cx + s(28), cy + s(60)), s(20), "#8fd4ef")
    rr((cx - s(15), cy - s(36), cx + s(15), cy - s(8)), s(7), "#72bfdf")
    rr((cx - s(19), cy + s(12), cx + s(19), cy + s(38)), s(8), "#e8fbff")


def bottle(cx, cy, scale=1.0):
    def s(v): return int(v * scale)
    rr((cx - s(22), cy - s(12), cx + s(22), cy + s(60)), s(18), "#b7dbaa")
    rr((cx - s(12), cy - s(36), cx + s(12), cy - s(12)), s(6), "#80b96d")


def camera_icon(cx, cy):
    rr((cx - 13, cy - 10, cx + 13, cy + 11), 6, "#d8d2cb")
    rr((cx - 5, cy - 16, cx + 5, cy - 8), 3, "#d8d2cb")
    draw.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), fill="#ffffff")


def tabbar(ox, y, w, active):
    rr((ox, y, ox + w, y + 62), 16, "#ffffff", "#eeeeee")
    labels = ["首页", "库存", "提醒", "账单", "我的"]
    icons = ["⌂", "▤", "♢", "☷", "○"]
    for i, (icon, label) in enumerate(zip(icons, labels)):
        cx = ox + w * (i + 0.5) / 5
        color = "#65bd7d" if i == active else "#9b9b9b"
        text((cx, y + 18), icon, F15, color, "mm")
        text((cx, y + 43), label, F9, color, "mm")


def draw_home(x):
    ox, oy, inner = phone(x, "主页面")
    text((ox + 2, oy + 16), "⌂ 关于 望月小家", F14, "#111")
    pill((ox + 136, oy + 4, ox + 218, oy + 29), "▣ 查看使用方法", "#fff", "#333", F8, "#dddddd")
    pill((ox + 224, oy + 4, ox + inner, oy + 29), "⇩ 导出清单", "#fff", "#333", F8, "#dddddd")
    rr((ox, oy + 43, ox + inner, oy + 79), 9, "#ffffff", "#e7e7e7")
    text((ox + 18, oy + 56), "⌕  搜索物品名称", F10, "#aaaaaa")
    labels = ["物品", "桌子", "衣柜", "厨房", "卫生间", "其他"]
    colors = ["#ffffff", "#f7a46f", "#f2c94c", "#8fd36d", "#76c7e7", "#b194e4"]
    for i, label in enumerate(labels):
        bx = ox + i * 47
        pill((bx, oy + 93, bx + 42, oy + 139), label, colors[i], "#111" if i == 0 else "#fff", F10, "#eeeeee" if i == 0 else None)
    cats = ["洗漱用品", "纸巾", "粮油调料", "其他"]
    for i, label in enumerate(cats):
        center((ox, oy + 150 + i * 72, ox + 62, oy + 214 + i * 72), label, F11)
    items = [
        ("抽纸", "阳台柜", "#b194e4", "剩余库存: 1包", "周期: 25天", "预计购买: 已到期", tissue),
        ("洗衣液", "卫生间", "#76c7e7", "剩余库存: 2瓶", "周期: 30天", "预计购买: 还需3天", detergent),
        ("洗手液", "衣柜", "#70c884", "剩余库存: 1瓶", "周期: 45天", "预计购买: 还需7天", bottle),
    ]
    for i, item in enumerate(items):
        y = oy + 147 + i * 128
        card((ox + 72, y, ox + inner, y + 114), 9)
        item[6](ox + 126, y + 64, 0.82)
        pill((ox + inner - 82, y + 16, ox + inner - 18, y + 42), item[1], item[2], "#fff", F9)
        text((ox + 188, y + 52), item[3], F10, "#555")
        text((ox + 188, y + 72), item[4], F10, "#555")
        text((ox + 188, y + 92), item[5], F10, "#ff6d36")
    rr((ox + 84, oy + 154, ox + 188, oy + 190), 8, "#ffffff", "#62bd7b", 2)
    center((ox + 84, oy + 154, ox + 188, oy + 190), "长按格子可编辑名称", F9, "#55a866")
    rr((ox + 58, oy + 501, ox + 170, oy + 544), 8, "#ffffff", "#62bd7b", 2)
    center((ox + 58, oy + 501, ox + 170, oy + 544), "长按物品可删除或\n查看完整信息", F9, "#55a866")
    rr((ox + inner - 56, oy + 518, ox + inner - 12, oy + 562), 22, "#63bd7a")
    center((ox + inner - 56, oy + 518, ox + inner - 12, oy + 562), "+", F23, "#fff")
    tabbar(ox, oy + 582, inner, 0)


def draw_detail(x):
    ox, oy, inner = phone(x, "物品详细信息", w=268, border="#91d0a0")
    text((ox, oy + 19), "‹", F23)
    text((ox + inner / 2, oy + 20), "物品详细信息", F12, "#111", "mm")
    rr((ox, oy + 52, ox + inner, oy + 561), 16, "#ffffff", "#91d0a0", 1)
    rr((ox + 10, oy + 62, ox + inner - 10, oy + 205), 8, "#fffdf9", "#e2e2e2")
    tissue(ox + inner / 2, oy + 137, 1.05)
    text((ox + inner / 2, oy + 188), "⌘  拍照/上传图片", F10, "#777", "mm")
    rows = [
        ("物品名称:", "抽纸"),
        ("所在位置:", "衣柜"),
        ("剩余库存:", "－   1   包   ＋"),
        ("周期:", "25天"),
        ("预计购买时间:", "已到期"),
        ("价格区间:", "12.90 ~ 18.80元"),
        ("具体位置:", "衣柜 > 最上层 > 第一个箱子"),
    ]
    y = oy + 218
    for label, value in rows:
        h = 42 if label != "具体位置:" else 48
        rr((ox + 10, y, ox + inner - 10, y + h), 6, "#ffffff", "#eeeeee")
        text((ox + 20, y + 14), label, F10)
        if label == "所在位置:":
            pill((ox + 92, y, ox + inner - 10, y + h), "衣柜", "#62bd7b", "#fff", F11)
        else:
            text((ox + inner - 24, y + 14), value, F10, "#f04f4f" if value == "已到期" else "#333", "ra")
        y += h + 8
    pill((ox + 22, oy + 575, ox + 108, oy + 618), "▤ 账单", "#fff", "#5fb878", F11, "#e3efe6")
    pill((ox + inner - 108, oy + 575, ox + inner - 22, oy + 618), "▣ 周期", "#fff", "#5b9de4", F11, "#dfeaf8")


def draw_profile(x):
    ox, oy, inner = phone(x, "我的", w=276)
    rr((ox + inner / 2 - 43, oy + 36, ox + inner / 2 + 43, oy + 122), 43, "#fffefb", "#91d0a0", 1)
    camera_icon(ox + inner / 2, oy + 75)
    text((ox + inner / 2, oy + 104), "点击上传头像", F8, "#999", "mm")
    card((ox + 8, oy + 160, ox + inner - 8, oy + 224), 9)
    text((ox + 28, oy + 186), "房子名称: 望月小家", F13, "#333")
    text((ox + 28, oy + 209), "可修改房子名称", F8, "#999")
    text((ox + inner - 32, oy + 194), "✎", F13, "#aaa")
    cells = [
        ("☁", "数据备份", "#72c884"),
        ("↓", "数据恢复", "#70b8df"),
        ("▦", "分类管理", "#ff9a50"),
        ("●", "位置管理", "#70b8df"),
        ("⚖", "单位管理", "#aa85d8"),
        ("i", "关于我们", "#ee7777"),
    ]
    for i, cell in enumerate(cells):
        cx = ox + 8 + (i % 2) * ((inner - 26) / 2 + 10)
        cy = oy + 239 + (i // 2) * 94
        card((cx, cy, cx + (inner - 26) / 2, cy + 78), 9)
        rr((cx + 45, cy + 12, cx + 83, cy + 50), 19, cell[2])
        center((cx + 45, cy + 12, cx + 83, cy + 50), cell[0], F14, "#fff")
        text((cx + 64, cy + 64), cell[1], F10, "#333", "mm")
    rr((ox + 8, oy + 524, ox + inner - 8, oy + 572), 8, "#ffffff", "#62bd7b", 1)
    center((ox + 8, oy + 524, ox + inner - 8, oy + 572), "也可以在主页面长按\n分类/位置格子快速编辑", F9, "#55a866")
    pill((ox + 8, oy + 592, ox + inner - 8, oy + 641), "▦  切换其他房子", "#62bd7b", "#fff", F13)
    tabbar(ox, oy + 651, inner, 4)


def draw_bill(x):
    ox, oy, inner = phone(x, "账单", w=284)
    text((ox, oy + 19), "‹", F23)
    text((ox + inner / 2, oy + 20), "抽纸的购买记录", F12, "#111", "mm")
    for i, label in enumerate(["价格从低到高", "价格从高到低", "时间由近到远"]):
        pill((ox + i * (inner / 3), oy + 52, ox + (i + 1) * (inner / 3), oy + 86), label, "#62bd7b" if i == 0 else "#fff", "#fff" if i == 0 else "#333", F9, "#eeeeee")
    rr((ox, oy + 98, ox + inner, oy + 135), 7, "#f5f5f5")
    for px, label in zip([18, 104, 176, 244], ["时间", "平台", "价格(元)", "数量"]):
        text((ox + px, oy + 113), label, F9, "#555")
    rows = [
        ("2026年\n03月03日", "京东", "京东2天", "12.90", "2包"),
        ("2026年\n03月01日", "淘宝", "淘宝3天", "15.80", "1包"),
        ("2026年\n02月28日", "拼多多", "拼多多3天", "18.80", "3包"),
        ("2026年\n02月25日", "线下超市", "线下0天", "16.00", "1包"),
    ]
    for i, row in enumerate(rows):
        y = oy + 154 + i * 114
        card((ox, y, ox + inner, y + 88), 9)
        text((ox + 13, y + 28), row[0], F10)
        rr((ox + 74, y + 28, ox + 99, y + 53), 5, "#ff3028")
        center((ox + 74, y + 28, ox + 99, y + 53), row[1][0], F9, "#fff")
        text((ox + 106, y + 28), row[1], F10)
        pill((ox + 106, y + 55, ox + 166, y + 75), row[2], "#f3f3f3", "#777", F8)
        text((ox + 201, y + 42), row[3], F12, "#ff4b4b", "mm")
        text((ox + 260, y + 42), row[4], F11, "#333", "mm")


def draw_cycle(x):
    ox, oy, inner = phone(x, "周期", w=286)
    text((ox, oy + 19), "‹", F23)
    text((ox + inner / 2, oy + 20), "抽纸", F12, "#111", "mm")
    rr((ox, oy + 58, ox + inner, oy + 691), 16, "#ffffff", "#eeeeee")
    y = oy + 82
    rows = [
        ("上上次购买时间", "2026年02月06日"),
        ("上次购买时间", "2026年03月03日"),
        ("购买周期(天)", "25"),
        ("下一次建议购买日期", "2026年03月25日"),
    ]
    for label, value in rows:
        text((ox + 24, y), label, F10)
        rr((ox + 24, y + 25, ox + inner - 24, y + 66), 7, "#ffffff", "#eeeeee")
        center((ox + 24, y + 25, ox + inner - 24, y + 66), value, F12, "#555")
        y += 85
    rr((ox + 24, y + 8, ox + inner - 24, y + 52), 7, "#f4f8f1")
    center((ox + 24, y + 8, ox + inner - 24, y + 52), "按购买周期 + 平台送达时间估算", F9, "#747d72")
    text((ox + 24, y + 84), "平台送达时间（默认值）", F9, "#777")
    chips = [("京东\n2天", "#f04f4f"), ("淘宝\n3天", "#fa8a2b"), ("拼多多\n3天", "#f04f4f"), ("线下\n0天", "#59a96a")]
    for i, chip in enumerate(chips):
        bx = ox + 24 + i * 57
        rr((bx, y + 108, bx + 49, y + 166), 7, "#fff", chip[1])
        center((bx, y + 108, bx + 49, y + 166), chip[0], F10, chip[1])
    pill((ox + 24, oy + 602, ox + 116, oy + 645), "取消", "#d4dae0", "#555", F11)
    pill((ox + inner - 116, oy + 602, ox + inner - 24, oy + 645), "确认设置", "#62bd7b", "#fff", F11)


rr((10, 10, 1540, 848), 14, "#fffdf9")
draw_home(32)
draw_detail(363)
draw_profile(647)
draw_bill(936)
draw_cycle(1232)
img.save("E:/store_wechatAPP/preview.png")

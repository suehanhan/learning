import { PrismaClient, Difficulty, QuestionSource, QuestionStatus, QuestionType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function kp(...titles: string[]) {
  return titles;
}

async function main() {
  const teacherEmail = "teacher@example.com";
  const teacherPassword = "teacher123";
  const teacherHash = await bcrypt.hash(teacherPassword, 10);

  await prisma.user.upsert({
    where: { email: teacherEmail },
    update: { role: Role.teacher, name: "示例教师", passwordHash: teacherHash, classGroup: "高二(1)班" },
    create: { role: Role.teacher, name: "示例教师", email: teacherEmail, passwordHash: teacherHash, classGroup: "高二(1)班" },
  });

  const studentEmail = "student@example.com";
  const studentHash = await bcrypt.hash("student123", 10);
  await prisma.user.upsert({
    where: { email: studentEmail },
    update: { role: Role.student, name: "示例学生", passwordHash: studentHash, classGroup: "高二(1)班" },
    create: { role: Role.student, name: "示例学生", email: studentEmail, passwordHash: studentHash, classGroup: "高二(1)班" },
  });

  const existingKnowledge = await prisma.knowledge.count();
  if (existingKnowledge === 0) {
    const rootBasics = await prisma.knowledge.create({
      data: {
        title: "基础知识",
        category: "root",
        content: "圆锥曲线三兄弟：椭圆、双曲线、抛物线。学习的关键是把方程里的参数与几何意义对应起来。",
        order: 1,
      },
    });

    const rootSkills = await prisma.knowledge.create({
      data: {
        title: "解题技巧",
        category: "root",
        content: "常见方法：设而不求、点差法、焦半径活用、参数法、对称性与数形结合。",
        order: 2,
      },
    });

    const rootConclusions = await prisma.knowledge.create({
      data: {
        title: "二级结论",
        category: "root",
        content: "把常用结论收拢成可直接调用的“工具箱”，降低综合题认知负担。",
        order: 3,
      },
    });

    const basicsEllipse = await prisma.knowledge.create({
      data: {
        parentId: rootBasics.id,
        category: "basic",
        title: "椭圆：定义与标准方程",
        content:
          "定义：到两个定点 $F_1,F_2$ 的距离之和为常数 $2a$ 的点的轨迹。\n\n标准方程（焦点在 $x$ 轴）：\n\n$$\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1\\ (a>b>0)$$\n\n焦距：$2c$，其中 $c^2=a^2-b^2$；离心率：$e=\\frac{c}{a}$。",
        order: 1,
      },
    });

    await prisma.knowledge.createMany({
      data: [
        {
          parentId: rootBasics.id,
          category: "basic",
          title: "双曲线：定义与标准方程",
          content:
            "定义：到两个定点 $F_1,F_2$ 的距离之差的绝对值为常数 $2a$ 的点的轨迹。\n\n标准方程（焦点在 $x$ 轴）：\n\n$$\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1\\ (a>0,b>0)$$\n\n其中 $c^2=a^2+b^2$，离心率 $e=\\frac{c}{a}>1$，渐近线 $y=\\pm\\frac{b}{a}x$。",
          order: 2,
        },
        {
          parentId: rootBasics.id,
          category: "basic",
          title: "抛物线：定义与标准方程",
          content:
            "定义：到定点 $F$ 与准线 $l$ 的距离相等的点的轨迹。\n\n标准方程（开口向右）：\n\n$$(y-k)^2=2p(x-h)\\ (p>0)$$\n\n焦点：$(h+\\frac{p}{2},k)$，准线：$x=h-\\frac{p}{2}$。",
          order: 3,
        },
        {
          parentId: basicsEllipse.id,
          category: "basic",
          title: "椭圆：几何性质速记",
          content:
            "顶点：$(\\pm a,0)$ 或 $(0,\\pm a)$；副顶点：$(0,\\pm b)$ 或 $(\\pm b,0)$。\n\n焦点：$(\\pm c,0)$ 或 $(0,\\pm c)$。\n\n通径长：$\\frac{2b^2}{a}$。\n\n焦半径：$PF_1+PF_2=2a$。",
          order: 4,
        },
        {
          parentId: rootSkills.id,
          category: "skill",
          title: "设而不求：用参数把未知“收起来”",
          content:
            "当题目出现“过定点/过动点/求范围”，常用做法是先设直线或点的参数（斜率 $k$、截距 $m$、参数 $t$），把复杂关系转成代数约束，再用判别式/不等式处理。",
          order: 1,
        },
        {
          parentId: rootSkills.id,
          category: "skill",
          title: "点差法：处理弦中点与斜率",
          content:
            "椭圆/双曲线中，若两点 $P(x_1,y_1),Q(x_2,y_2)$ 在曲线上，联立得到两式相减，可消去常数项，获得与中点、斜率相关的关系式。",
          order: 2,
        },
        {
          parentId: rootConclusions.id,
          category: "conclusion",
          title: "焦点弦与通径",
          content:
            "以椭圆为例：过焦点且垂直于长轴的弦称通径，其长度为 $\\frac{2b^2}{a}$。\n\n相关题型：求焦点弦长、求点到焦点距离、求面积或范围。",
          order: 1,
        },
        {
          parentId: rootConclusions.id,
          category: "conclusion",
          title: "切线方程模板",
          content:
            "椭圆 $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$ 在点 $(x_0,y_0)$ 处的切线：\n\n$$\\frac{xx_0}{a^2}+\\frac{yy_0}{b^2}=1$$\n\n抛物线、双曲线也有类似“把平方替换成乘积”的模板，做题前先确认点在曲线上。",
          order: 2,
        },
      ],
    });
  }

  const existingQuestions = await prisma.question.count();
  if (existingQuestions < 60) {
    await prisma.generatedQuestion.deleteMany();
    await prisma.studyRecord.deleteMany();
    await prisma.wrongQuestionBook.deleteMany();
    await prisma.testReport.deleteMany();
    await prisma.chatHistory.deleteMany();
    await prisma.curveState.deleteMany();
    await prisma.question.deleteMany();

    const basics = createPresetQuestions(Difficulty.basic);
    const medium = createPresetQuestions(Difficulty.medium);
    const hard = createPresetQuestions(Difficulty.hard);

    await prisma.question.createMany({ data: [...basics, ...medium, ...hard] });
  }
}

function createPresetQuestions(difficulty: Difficulty) {
  const tagByLevel: Record<Difficulty, string> = {
    basic: "基础",
    medium: "中等",
    hard: "困难",
  };

  const make = (data: {
    type: QuestionType;
    content: string;
    answer: string;
    solution: string;
    pitfalls: string;
    knowledgePoints: string[];
  }) => ({
    type: data.type,
    difficulty,
    content: data.content,
    answer: data.answer,
    solution: data.solution,
    pitfalls: data.pitfalls,
    knowledgePoints: data.knowledgePoints,
    source: QuestionSource.preset,
    status: QuestionStatus.approved,
  });

  const level = tagByLevel[difficulty];

  const ellipseSet = [
    { a: 5, b: 3 },
    { a: 4, b: 2 },
    { a: 6, b: 4 },
    { a: 3, b: 2 },
    { a: 8, b: 6 },
    { a: 5, b: 4 },
    { a: 7, b: 5 },
  ];

  const hyperbolaSet = [
    { a: 3, b: 2 },
    { a: 4, b: 3 },
    { a: 2, b: 1 },
    { a: 5, b: 4 },
    { a: 6, b: 2 },
    { a: 3, b: 1 },
    { a: 4, b: 1 },
  ];

  const parabolaSet = [
    { p: 2 },
    { p: 4 },
    { p: 1 },
    { p: 6 },
    { p: 3 },
    { p: 8 },
  ];

  const questions: ReturnType<typeof make>[] = [];

  for (let i = 0; i < 7; i++) {
    const { a, b } = ellipseSet[i];
    const c = Math.sqrt(Math.max(a * a - b * b, 0));
    const e = c / a;
    questions.push(
      make({
        type: QuestionType.blank,
        content:
          `【${level}·椭圆】已知椭圆 $\\dfrac{x^2}{${a ** 2}}+\\dfrac{y^2}{${b ** 2}}=1\\,(a>b>0)$。\n\n(1) 计算 $c$ 与离心率 $e$。`,
        answer: `c=${c.toFixed(3)}, e=${e.toFixed(3)}`,
        solution:
          `由 $c^2=a^2-b^2$ 得 $c=\\sqrt{${a ** 2}-${b ** 2}}=${c.toFixed(3)}$。\n\n离心率 $e=\\dfrac{c}{a}=${e.toFixed(3)}$。`,
        pitfalls: "易错点：把 $c^2=a^2+b^2$ 误用于椭圆；或把 $e=c/b$。",
        knowledgePoints: kp("椭圆：定义与标准方程", "椭圆：几何性质速记"),
      }),
    );
  }

  for (let i = 0; i < 7; i++) {
    const { a, b } = hyperbolaSet[i];
    const c = Math.sqrt(a * a + b * b);
    const e = c / a;
    questions.push(
      make({
        type: QuestionType.choice,
        content:
          `【${level}·双曲线】双曲线 $\\dfrac{x^2}{${a ** 2}}-\\dfrac{y^2}{${b ** 2}}=1$ 的渐近线方程是（ ）\n\nA. $y=\\pm\\dfrac{${b}}{${a}}x$  \nB. $y=\\pm\\dfrac{${a}}{${b}}x$  \nC. $y=\\pm\\dfrac{${c.toFixed(2)}}{${a}}x$  \nD. $y=\\pm\\dfrac{${b}}{${c.toFixed(2)}}x$`,
        answer: "A",
        solution: `双曲线 $\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1$ 的渐近线为 $y=\\pm\\frac{b}{a}x$，故选 A。`,
        pitfalls: "易错点：把 $a,b$ 写反（常见于记忆不牢或误把斜率写成 $a/b$）。",
        knowledgePoints: kp("双曲线：定义与标准方程"),
      }),
    );
  }

  for (let i = 0; i < 6; i++) {
    const { p } = parabolaSet[i];
    const focusX = p / 2;
    questions.push(
      make({
        type: QuestionType.blank,
        content:
          `【${level}·抛物线】抛物线 $y^2=2\\cdot ${p}\\,x$ 的焦点坐标为（写出 $F$）。`,
        answer: `F(${focusX},0)`,
        solution: `对比 $y^2=2px$，可得 $p=${p}$，焦点 $F(\\frac{p}{2},0)=(${focusX},0)$。`,
        pitfalls: "易错点：把焦点写成 $(p,0)$；或混淆准线位置。",
        knowledgePoints: kp("抛物线：定义与标准方程"),
      }),
    );
  }

  const extra = [
    make({
      type: QuestionType.solution,
      content:
        `【${level}·综合】比较椭圆与双曲线离心率的范围，并说明它反映的几何意义。`,
      answer: "椭圆 0<e<1，双曲线 e>1，抛物线 e=1（拓展）。",
      solution:
        "椭圆：$c^2=a^2-b^2$，所以 $c<a$，故 $0<e=c/a<1$；双曲线：$c^2=a^2+b^2$，所以 $c>a$，故 $e>1$。\n\n几何意义：离心率越大，曲线越“张开/扁长”；椭圆 e 越接近 0 越接近圆，越接近 1 越扁。",
      pitfalls: "易错点：把双曲线也写成 $e<1$；或只背结论不解释来源。",
      knowledgePoints: kp("椭圆：定义与标准方程", "双曲线：定义与标准方程"),
    }),
  ];

  return [...questions, ...extra];
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

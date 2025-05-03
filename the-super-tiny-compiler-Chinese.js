'use strict';

/**
 * 今天我们要一起编写一个编译器。但不是普通的编译器...而是一个超级迷你的微型编译器！这个编译器非常小，如果去掉所有注释，实际代码只有约200行。
 *
 * 我们要将一些类似Lisp的函数调用编译成类似C的函数调用。
 *
 * 如果你对其中一种或两种都不熟悉。我来简单介绍一下。
 *
 * 如果有两个函数`add`和`subtract`，它们会这样写：
 *
 *                 LISP                      C
 *
 *  2 + 2          (add 2 2)                 add(2, 2)
 *  4 - 2          (subtract 4 2)            subtract(4, 2)
 *  2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 *
 * 很简单对吧？
 *
 * 很好，因为这正是我们要编译的内容。虽然这不是完整的LISP或C语法，但足以展示现代编译器的主要组成部分。
 */

/**
 * 大多数编译器分为三个主要阶段：解析、转换和代码生成
 *
 * 1. *解析*是将原始代码转换为更抽象的代码表示形式。
 *
 * 2. *转换*获取这个抽象表示并对其进行操作，以实现编译器想要的功能。
 *
 * 3. *代码生成*将转换后的代码表示转换为新代码。
 */

/**
 * 解析
 * -------
 *
 * 解析通常分为两个阶段：词法分析和语法分析。
 *
 * 1. *词法分析*通过分词器(或词法分析器)将原始代码分割成称为标记的东西。
 *
 *    标记是描述语法孤立部分的小对象数组。它们可以是数字、标签、标点符号、运算符等。
 *
 * 2. *语法分析*获取标记并将其重新格式化为描述语法各部分及其相互关系的表示形式。这被称为中间表示或抽象语法树(AST)。
 *
 *    抽象语法树(简称AST)是一个深度嵌套的对象，以一种既易于使用又能告诉我们大量信息的方式表示代码。
 *
 * 对于以下语法：
 *
 *  (add 2 (subtract 4 2))
 *
 * 标记可能看起来像这样：
 *
 *   [
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'add'      },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'subtract' },
 *     { type: 'number', value: '4'        },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: ')'        },
 *     { type: 'paren',  value: ')'        },
 *   ]
 *
 * 抽象语法树(AST)可能看起来像这样：
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2',
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4',
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2',
 *         }]
 *       }]
 *     }]
 *   }
 */

/**
 * 转换
 * --------------
 *
 * 编译器的下一个阶段是转换。这一步获取上一步的AST并对其进行修改。它可以操作相同语言的AST，也可以将其翻译成全新的语言。
 *
 * 让我们看看如何转换AST。
 *
 * 你可能会注意到我们的AST中有看起来非常相似的元素。这些带有类型属性的对象被称为AST节点。这些节点上定义了描述树中孤立部分的属性。
 *
 * 我们可以有一个"NumberLiteral"节点：
 *
 *   {
 *     type: 'NumberLiteral',
 *     value: '2',
 *   }
 *
 * 或者一个"CallExpression"节点：
 *
 *   {
 *     type: 'CallExpression',
 *     name: 'subtract',
 *     params: [...嵌套的节点...],
 *   }
 *
 * 转换AST时，我们可以通过添加/删除/替换属性来操作节点，可以添加新节点、删除节点，或者保持现有AST不变并基于它创建全新的AST。
 *
 * 由于我们的目标是新语言，我们将专注于创建特定于目标语言的完全新AST。
 *
 * 遍历
 * ---------
 *
 * 为了导航所有这些节点，我们需要能够遍历它们。这个遍历过程深度优先地访问AST中的每个节点。
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2'
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4'
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2'
 *         }]
 *       }]
 *     }]
 *   }
 *
 * 对于上面的AST，我们会这样遍历：
 *
 *   1. Program - 从AST的顶层开始
 *   2. CallExpression (add) - 移动到Program body的第一个元素
 *   3. NumberLiteral (2) - 移动到CallExpression params的第一个元素
 *   4. CallExpression (subtract) - 移动到CallExpression params的第二个元素
 *   5. NumberLiteral (4) - 移动到CallExpression params的第一个元素
 *   6. NumberLiteral (2) - 移动到CallExpression params的第二个元素
 *
 * 如果我们直接操作这个AST，而不是创建单独的AST，我们可能会在这里引入各种抽象。但仅仅访问树中的每个节点就足以满足我们的需求。
 *
 * 我使用"访问"这个词是因为有一种表示对对象结构元素操作的模式。
 *
 * 访问者
 * --------
 *
 * 基本思想是创建一个"访问者"对象，该对象具有接受不同节点类型的方法。
 *
 *   var visitor = {
 *     NumberLiteral() {},
 *     CallExpression() {},
 *   };
 *
 * 当我们遍历AST时，每当"进入"匹配类型的节点时，就会调用此访问者上的方法。
 *
 * 为了使这有用，我们还将传递节点和对其父节点的引用。
 *
 *   var visitor = {
 *     NumberLiteral(node, parent) {},
 *     CallExpression(node, parent) {},
 *   };
 *
 * 然而，也存在在"退出"时调用方法的可能性。想象一下之前以列表形式表示的树结构：
 *
 *   - Program
 *     - CallExpression
 *       - NumberLiteral
 *       - CallExpression
 *         - NumberLiteral
 *         - NumberLiteral
 *
 * 当我们向下遍历时，会遇到死胡同的分支。当我们完成树的每个分支时，就会"退出"它。所以向下遍历时我们"进入"每个节点，向上返回时我们"退出"。
 *
 *   -> Program (进入)
 *     -> CallExpression (进入)
 *       -> Number Literal (进入)
 *       <- Number Literal (退出)
 *       -> Call Expression (进入)
 *          -> Number Literal (进入)
 *          <- Number Literal (退出)
 *          -> Number Literal (进入)
 *          <- Number Literal (退出)
 *       <- CallExpression (退出)
 *     <- CallExpression (退出)
 *   <- Program (退出)
 *
 * 为了支持这一点，我们访问者的最终形式将如下所示：
 *
 *   var visitor = {
 *     NumberLiteral: {
 *       enter(node, parent) {},
 *       exit(node, parent) {},
 *     }
 *   };
 */

/**
 * 代码生成
 * ---------------
 *
 * 编译器的最后阶段是代码生成。有时编译器会做一些与转换重叠的事情，但大多数情况下代码生成只是将我们的AST转换回字符串形式的代码。
 *
 * 代码生成器有几种不同的工作方式，一些编译器会重用早期的标记，其他编译器会创建代码的单独表示以便线性打印节点，但据我所知大多数会使用我们刚刚创建的相同AST，这也是我们将要关注的。
 *
 * 实际上我们的代码生成器将知道如何"打印"AST的所有不同节点类型，并且它会递归调用自己来打印嵌套节点，直到所有内容都被打印成一个长代码字符串。
 */

/**
 * 就是这样！这就是编译器的所有不同部分。
 *
 * 这并不是说每个编译器都完全像我这里描述的那样。编译器有许多不同的用途，它们可能需要比我详述的更多步骤。
 *
 * 但现在你应该对大多数编译器的样子有一个大致的高层次了解。
 *
 * 既然我已经解释了所有这些，你们都准备好编写自己的编译器了吧？
 *
 * 开玩笑的，这就是我在这里帮忙的原因 :P
 *
 * 所以让我们开始...
 */

/**
 * ============================================================================
 *                                   (/^▽^)/
 *                                分词器！
 * ============================================================================
 */

/**
 * 我们将从解析的第一个阶段——词法分析开始，使用分词器。
 *
 * 我们只需获取代码字符串并将其分解为标记数组。
 *
 *   (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */

// 我们首先接受一个输入代码字符串，并设置两个东西...
function tokenizer(input) {
    // 一个`current`变量，用于像光标一样跟踪我们在代码中的位置
    let current = 0;

    // 和一个`tokens`数组，用于推送我们的标记
    let tokens = [];

    // 我们创建一个`while`循环，在循环内部设置`current`变量，可以根据需要递增
    //
    // 我们这样做是因为在一个循环中我们可能希望多次递增`current`，因为我们的标记可以是任意长度
    while (current < input.length) {
        // 我们还将存储`input`中的`current`字符
        let char = input[current];

        // 我们首先要检查的是开括号。这将稍后用于`CallExpression`，但现在我们只关心字符
        //
        // 我们检查是否有开括号：
        if (char === '(') {
            // 如果有，我们推送一个类型为`paren`的新标记，并将值设置为开括号
            tokens.push({
                type: 'paren',
                value: '(',
            });

            // 然后我们递增`current`
            current++;

            // 并`continue`到循环的下一个周期
            continue;
        }

        // 接下来我们检查闭括号。我们做与之前完全相同的事情：检查闭括号，添加新标记，递增`current`，然后`continue`
        if (char === ')') {
            tokens.push({
                type: 'paren',
                value: ')',
            });
            current++;
            continue;
        }

        // 继续，我们现在要检查空白。这很有趣，因为我们关心空白存在以分隔字符，但实际上不需要将其存储为标记。我们稍后会丢弃它
        //
        // 所以我们只是测试是否存在，如果存在就`continue`
        let WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        // 下一种标记类型是数字。这与我们之前见过的不同，因为数字可以是任意数量的字符，我们希望将整个字符序列捕获为一个标记
        //
        //   (add 123 456)
        //        ^^^ ^^^
        //        只有两个单独的标记
        //
        // 所以当我们遇到序列中的第一个数字时开始
        let NUMBERS = /[0-9]/;
        if (NUMBERS.test(char)) {
            // 我们创建一个`value`字符串，将字符推送到其中
            let value = '';

            // 然后我们循环遍历序列中的每个字符，直到遇到非数字字符，将每个数字字符推送到我们的`value`并递增`current`
            while (NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }

            // 之后我们将`number`标记推送到`tokens`数组
            tokens.push({ type: 'number', value });

            // 然后继续
            continue;
        }

        // 我们还将为语言中的字符串添加支持，这些字符串是被双引号(")包围的任何文本
        //
        //   (concat "foo" "bar")
        //            ^^^   ^^^ 字符串标记
        //
        // 我们从检查开引号开始：
        if (char === '"') {
            // 保持一个`value`变量来构建我们的字符串标记
            let value = '';

            // 我们将在标记中跳过开双引号
            char = input[++current];

            // 然后我们遍历每个字符，直到到达另一个双引号
            while (char !== '"') {
                value += char;
                char = input[++current];
            }

            // 跳过闭双引号
            char = input[++current];

            // 并将我们的`string`标记添加到`tokens`数组
            tokens.push({ type: 'string', value });

            continue;
        }

        // 最后一种标记将是`name`标记。这是一个字母序列而不是数字，是我们lisp语法中函数的名称
        //
        //   (add 2 4)
        //    ^^^
        //    名称标记
        //
        let LETTERS = /[a-z]/i;
        if (LETTERS.test(char)) {
            let value = '';

            // 我们再次循环遍历所有字母将它们推送到value
            while (LETTERS.test(char)) {
                value += char;
                char = input[++current];
            }

            // 并将该值作为类型为`name`的标记推送并继续
            tokens.push({ type: 'name', value });

            continue;
        }

        // 最后，如果我们现在还没有匹配到字符，我们将抛出错误并完全退出
        throw new TypeError('我不知道这个字符是什么: ' + char);
    }

    // 然后在我们的`tokenizer`结束时，我们简单地返回tokens数组
    return tokens;
}

/**
 * ============================================================================
 *                                 ヽ/❀o ل͜ o\ﾉ
 *                                解析器!!!
 * ============================================================================
 */

/**
 * 对于我们的解析器，我们将获取标记数组并将其转换为AST
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */

// 好的，我们定义一个接受标记数组的`parser`函数
function parser(tokens) {
    // 我们再次保持一个`current`变量作为光标
    let current = 0;

    // 但这次我们将使用递归而不是`while`循环。所以我们定义一个`walk`函数
    function walk() {
        // 在walk函数内部，我们首先获取`current`标记
        let token = tokens[current];

        // 我们将每种类型的标记分成不同的代码路径，从`number`标记开始
        //
        // 我们测试是否有`number`标记
        if (token.type === 'number') {
            // 如果有，我们递增`current`
            current++;

            // 并返回一个名为`NumberLiteral`的新AST节点，并将其值设置为标记的值
            return {
                type: 'NumberLiteral',
                value: token.value,
            };
        }

        // 如果我们有字符串，我们将做与数字相同的事情并创建一个`StringLiteral`节点
        if (token.type === 'string') {
            current++;

            return {
                type: 'StringLiteral',
                value: token.value,
            };
        }

        // 接下来我们寻找CallExpressions。当我们遇到开括号时开始
        if (
            token.type === 'paren' &&
            token.value === '('
        ) {
            // 我们将递增`current`跳过括号，因为我们在AST中不关心它
            token = tokens[++current];

            // 我们创建一个类型为`CallExpression`的基础节点，并将名称设置为当前标记的值，因为开括号后的下一个标记是函数名
            let node = {
                type: 'CallExpression',
                name: token.value,
                params: [],
            };

            // 我们再次递增`current`跳过名称标记
            token = tokens[++current];

            // 现在我们要遍历每个将成为`CallExpression`的`params`的标记，直到遇到闭括号
            //
            // 这就是递归的用武之地。我们不是尝试解析可能无限嵌套的节点集，而是依赖递归来解决
            //
            // 为了解释这一点，让我们看看我们的Lisp代码。你可以看到`add`的参数是一个数字和一个嵌套的`CallExpression`，它包含自己的数字
            //
            //   (add 2 (subtract 4 2))
            //
            // 你还会注意到在我们的标记数组中有多个闭括号
            //
            //   [
            //     { type: 'paren',  value: '('        },
            //     { type: 'name',   value: 'add'      },
            //     { type: 'number', value: '2'        },
            //     { type: 'paren',  value: '('        },
            //     { type: 'name',   value: 'subtract' },
            //     { type: 'number', value: '4'        },
            //     { type: 'number', value: '2'        },
            //     { type: 'paren',  value: ')'        }, <<< 闭括号
            //     { type: 'paren',  value: ')'        }, <<< 闭括号
            //   ]
            //
            // 我们将依赖嵌套的`walk`函数来递增我们的`current`变量，越过任何嵌套的`CallExpression`

            // 所以我们创建一个`while`循环，直到遇到类型为`'paren'`且值为闭括号的标记
            while (
                (token.type !== 'paren') ||
                (token.type === 'paren' && token.value !== ')')
            ) {
                // 我们将调用`walk`函数，它将返回一个`node`，我们将其推入`node.params`
                node.params.push(walk());
                token = tokens[current];
            }

            // 最后我们将最后一次递增`current`跳过闭括号
            current++;

            // 并返回节点
            return node;
        }

        // 再次，如果我们现在还没有识别出标记类型，我们将抛出错误
        throw new TypeError(token.type);
    }

    // 现在，我们将创建我们的AST，它将有一个根节点`Program`
    let ast = {
        type: 'Program',
        body: [],
    };

    // 我们将启动我们的`walk`函数，将节点推送到`ast.body`数组
    //
    // 我们在循环中这样做是因为我们的程序可以有一个接一个的`CallExpression`，而不是嵌套的
    //
    //   (add 2 2)
    //   (subtract 4 2)
    //
    while (current < tokens.length) {
        ast.body.push(walk());
    }

    // 在解析器结束时，我们返回AST
    return ast;
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                               遍历器!!!
 * ============================================================================
 */

/**
 * 现在我们有了AST，我们希望能够用访问者访问不同的节点。我们需要在遇到匹配类型的节点时能够调用访问者上的方法。
 *
 *   traverse(ast, {
 *     Program: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     CallExpression: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     NumberLiteral: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *   });
 */

// 我们定义一个遍历器函数，它接受AST和访问者
function traverser(ast, visitor) {

    // 一个`traverseArray`函数，允许我们遍历数组并调用我们将定义的下一个函数：`traverseNode`
    function traverseArray(array, parent) {
        array.forEach(child => {
            traverseNode(child, parent);
        });
    }

    // `traverseNode`将接受一个`node`和它的`parent`节点，以便可以将两者传递给我们的访问者方法
    function traverseNode(node, parent) {

        // 我们首先测试访问者上是否存在与`type`匹配的方法
        let methods = visitor[node.type];

        // 如果这个节点类型有`enter`方法，我们用`node`和它的`parent`调用它
        if (methods && methods.enter) {
            methods.enter(node, parent);
        }

        // 接下来我们将按当前节点类型拆分
        switch (node.type) {

            // 我们从顶层`Program`开始。由于Program节点有一个名为body的属性，该属性有一个节点数组，我们将调用`traverseArray`来深入遍历它们
            //
            // (记住`traverseArray`会依次调用`traverseNode`，所以我们导致树被递归遍历)
            case 'Program':
                traverseArray(node.body, node);
                break;

            // 接下来我们对`CallExpression`做同样的事情，并遍历它们的`params`
            case 'CallExpression':
                traverseArray(node.params, node);
                break;

            // 对于`NumberLiteral`和`StringLiteral`，我们没有任何子节点需要访问，所以直接break
            case 'NumberLiteral':
            case 'StringLiteral':
                break;

            // 再次，如果我们没有识别出节点类型，就抛出错误
            default:
                throw new TypeError(node.type);
        }

        // 如果这个节点类型有`exit`方法，我们用`node`和它的`parent`调用它
        if (methods && methods.exit) {
            methods.exit(node, parent);
        }
    }

    // 最后我们通过调用`traverseNode`启动遍历器，传入我们的ast，没有`parent`，因为AST顶层没有父节点
    traverseNode(ast, null);
}

/**
 * ============================================================================
 *                                   ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                              转换器!!!
 * ============================================================================
 */

/**
 * 接下来是转换器。我们的转换器将获取我们构建的AST，将其传递给我们的遍历器函数和访问者，并创建一个新的ast
 */

// 我们有一个转换器函数，它将接受lisp ast
function transformer(ast) {

    // 我们将创建一个`newAst`，像我们之前的AST一样有一个program节点
    let newAst = {
        type: 'Program',
        body: [],
    };

    // 接下来我要稍微作弊一下，创建一个hack。我们将在父节点上使用一个名为`context`的属性，我们将把节点推送到它们的父节点的`context`中
    //
    // 请注意，context是从旧ast到新ast的引用
    ast._context = newAst.body;

    // 我们将通过调用遍历器函数和我们的ast以及访问者来开始
    traverser(ast, {

        // 第一个访问者方法接受任何`NumberLiteral`
        NumberLiteral: {
            // 我们将在进入时访问它们
            enter(node, parent) {
                // 我们将创建一个同样名为`NumberLiteral`的新节点，推送到父context
                parent._context.push({
                    type: 'NumberLiteral',
                    value: node.value,
                });
            },
        },

        // 接下来是`StringLiteral`
        StringLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'StringLiteral',
                    value: node.value,
                });
            },
        },

        // 接下来是`CallExpression`
        CallExpression: {
            enter(node, parent) {

                // 我们开始创建一个新节点`CallExpression`，带有一个嵌套的`Identifier`
                let expression = {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: node.name,
                    },
                    arguments: [],
                };

                // 接下来我们将在原始的`CallExpression`节点上定义一个新的context，该context将引用`expression`的arguments，以便我们可以推送参数
                node._context = expression.arguments;

                // 然后我们将检查父节点是否是`CallExpression`
                // 如果不是...
                if (parent.type !== 'CallExpression') {

                    // 我们将用`ExpressionStatement`包装我们的`CallExpression`节点。我们这样做是因为JavaScript中的顶层`CallExpression`实际上是语句
                    expression = {
                        type: 'ExpressionStatement',
                        expression: expression,
                    };
                }

                // 最后，我们将(可能包装过的)`CallExpression`推送到`parent`的`context`
                parent._context.push(expression);
            },
        }
    });

    // 在转换器函数结束时，我们将返回我们刚刚创建的新ast
    return newAst;
}

/**
 * ============================================================================
 *                               ヾ（〃＾∇＾）ﾉ♪
 *                           代码生成器!!!!
 * ============================================================================
 */

/**
 * 现在让我们进入最后一个阶段：代码生成器
 *
 * 我们的代码生成器将递归调用自己，将树中的每个节点打印成一个巨大的字符串
 */

function codeGenerator(node) {

    // 我们将按节点的`type`来分解
    switch (node.type) {

        // 如果我们有一个`Program`节点。我们将遍历`body`中的每个节点，并通过代码生成器运行它们，用换行符连接它们
        case 'Program':
            return node.body.map(codeGenerator)
                .join('\n');

        // 对于`ExpressionStatement`，我们将在嵌套的expression上调用代码生成器，并添加一个分号...
        case 'ExpressionStatement':
            return (
                codeGenerator(node.expression) +
                ';' // << (...因为我们喜欢用*正确*的方式编码)
            );

        // 对于`CallExpression`，我们将打印`callee`，添加一个开括号，遍历`arguments`数组中的每个节点并通过代码生成器运行它们，用逗号连接它们，然后添加一个闭括号
        case 'CallExpression':
            return (
                codeGenerator(node.callee) +
                '(' +
                node.arguments.map(codeGenerator)
                    .join(', ') +
                ')'
            );

        // 对于`Identifier`，我们只返回`node`的name
        case 'Identifier':
            return node.name;

        // 对于`NumberLiteral`，我们只返回`node`的value
        case 'NumberLiteral':
            return node.value;

        // 对于`StringLiteral`，我们将在`node`的value周围添加引号
        case 'StringLiteral':
            return '"' + node.value + '"';

        // 如果我们没有识别出节点，就抛出错误
        default:
            throw new TypeError(node.type);
    }
}

/**
 * ============================================================================
 *                                  (۶* ‘ヮ’)۶”
 *                         !!!!!!!!编译器!!!!!!!!
 * ============================================================================
 */

/**
 * 最后！我们将创建我们的`compiler`函数。在这里我们将把管道的每个部分连接起来
 *
 *   1. 输入  => 分词器   => 标记
 *   2. 标记 => 解析器      => AST
 *   3. AST    => 转换器 => 新AST
 *   4. 新AST => 生成器   => 输出
 */

function compiler(input) {
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let newAst = transformer(ast);
    let output = codeGenerator(newAst);

    // 然后简单地返回输出！
    return output;
}

/**
 * ============================================================================
 *                                   (๑˃̵ᴗ˂̵)و
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!你做到了!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ============================================================================
 */

// 现在我只需要导出所有内容...
module.exports = {
    tokenizer,
    parser,
    traverser,
    transformer,
    codeGenerator,
    compiler,
};


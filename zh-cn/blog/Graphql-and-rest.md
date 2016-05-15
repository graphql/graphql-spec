在开源领域有一个趋势我有点烦：大公司宣布他们要开源一些东西，但压根就没有看到任何东西。宣布也就意味着想要一些反馈，特别是想拿出来开源。当所考虑的软件是否开放
还是说闭源只要能进行反馈，其实我不太在意，这样我就很好奇迟迟不发布的原因到底是神马。

更让人困扰的是所宣布的东西仍然还在进行大量开发，离release遥遥无期，要怎么样才能够进行feedback呢？但既然你说了要开源，我觉得我们应该毫不持续，怎么着都要给你些意见。
Facebook 最近做了很多这样的蠢事：显示在release React Native之前就宣布开源，也宣布Relay 和GraphQL，但二者都还没有release。在一些讲座上和博文里，提到一些信息，但其他的就
是speculation。如果你想了解更多Relay 和GraphQL的信息，强烈建议你看一看 Laney Kuenzel的这个[slide]((https://speakerdeck.com/laneyk/mutations-in-relay)
.
从我们了解到的信息来看，Relay确实很有意思。我觉得将来我可能会选择使用Relay。也就是说随着基础设施的成熟，总有一天我要实现 GraphQL，或者类似的玩意。
React是对如何构建客户端的web applicationUI的再思考。React挑战了MVC和双向的数据绑定。GraphQL (https://facebook.github.io/react/blog/2015/05/01/graphql- introduction.html) 是对客户端 web application与后台通信方式的再思考。

## Rest

喜闻乐见的Rest？现如今大量的前端应用一般都与HTTP的后端进行交互。这些后端应用遵循一些基本的REST 模式：URL中包含了资源，可以使用HTTP Verb预期交互，一些资源表示
单个项。

```
/users/faassen
```
如果发起 GET 请求，你会得到一个JSON 格式的表示，你也可以调用 PUT 请求来覆盖它的表示，使用 DELETE 来删除内容。
在HTTP API 中我们一般也有方法来访问集合 collection：

```
/users
```

你也可以使用 GET，可以使用一些 HTTP query 变量来过滤结果，调用POST 请求来新增一个 user。

真正理想的REST API，也被称之为 Hypermedia API，远远不止于此：资源之间存在hyperlink。我曾经写过一个叫[Morepath](https://morepath.readthedocs.org/))的web框架。
,旨在简化构建复杂hypermedia API过程，你也可以说我十分擅长REST。


## REST 存在的挑战

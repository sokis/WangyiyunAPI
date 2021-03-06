/**
 * 网易云 api 主文件入口
 */

// 初始化 express
var app = require('express')();

// 初始化 superagent 模块
var request = require('superagent');

// 加载 cheerio 模块
var cheerio = require('cheerio');

function checkId(id){
    return /^[0-9]+$/.test(id);
}

// 网易云音乐推荐列表接口
app.get('/recommend_list', function(req, res){

    // 定义请求 url
    var requestUrl = 'http://music.163.com/discover';
    // 初始化返回对象
    var resObj = {
        code: 200,
        message: "加载成功",
        data: []
    };

    // 使用 superagent 访问 discover 页面
    request.get(requestUrl)
        .end(function(err, _response){

            if (!err) {

                // 请求成功
                var dom = _response.text;

                // 使用 cheerio 加载 dom
                var $ = cheerio.load(dom);
                // 定义我们要返回的数组
                var recommendLst = [];
                // 获得 .m-cvrlst 的 ul 元素
                $('.m-cvrlst').eq(0).find('li').each(function(index, element){

                    // 获得 a 链接
                    var cvrLink = $(element).find('.u-cover').find('a');
                    // 获得 cover 歌单封面
                    var cover = $(element).find('.u-cover').find('img').attr('src');
                    // 组织单个推荐歌单对象结构
                    var recommendItem = {
                        id: cvrLink.attr('data-res-id'),
                        title: cvrLink.attr('title'),
                        href: 'http://music.163.com' + cvrLink.attr('href'),
                        type: cvrLink.attr('data-res-type'),
                        cover: cover
                    };
                    // 将单个对象放在数组中
                    recommendLst.push(recommendItem);

                });

                // 替换返回对象
                resObj.data = recommendLst;

            } else {
                resObj.code = 404;
                resObj.message = "获取API出现问题";
                console.err('Get data error !');
            }

            // 响应数据
            res.send( resObj );

        });

});

// 网易云音乐根据歌单ID获得歌单详细列表的接口
app.get('/play_list/:playlistId', function(req, res){

    // 获得歌单ID
    var playlistId = req.params.playlistId;
    // 定义请求 url
    var requestUrl = 'http://music.163.com/playlist?id=' + playlistId;
    // 定义返回对象
    var resObj = {
        code: 200,
        message: "加载成功",
        data: {}
    };

    if (checkId(playlistId)) {
        request.get(requestUrl)
            .end(function(err, _response){

                if (!err) {
                    // 定义歌单对象
                    var playlist = {
                        id: playlistId
                    };

                    // 成功返回 HTML, decodeEntities 指定不把中文字符转为 unicode 字符
                    // 如果不指定 decodeEntities 为 false , 例如 " 会解析为 &quot;
                    var $ = cheerio.load(_response.text,{decodeEntities: false});
                    // 获得歌单 dom
                    var dom = $('#m-playlist');
                    // 歌单标题
                    playlist.title = dom.find('.tit').text();
                    // 歌单拥有者
                    playlist.owner = dom.find('.user').find('.name').text();
                    // 创建时间
                    playlist.create_time =  dom.find('.user').find('.time').text();
                    // 歌单被收藏数量
                    playlist.collection_count = dom.find('#content-operation').find('.u-btni-fav').attr('data-count');
                    // 分享数量
                    playlist.share_count = dom.find('#content-operation').find('.u-btni-share').attr('data-count');
                    // 评论数量
                    playlist.comment_count = dom.find('#content-operation').find('#cnt_comment_count').html();
                    // 标签
                    playlist.tags = [];
                    dom.find('.tags').eq(0).find('.u-tag').each(function(index, element){
                        playlist.tags.push($(element).text());
                    });
                    // 歌单描述
                    playlist.desc = dom.find('#album-desc-more').html();
                    // 歌曲总数量
                    playlist.song_count = dom.find('#playlist-track-count').text();
                    // 播放总数量
                    playlist.play_count = dom.find('#play-count').text();

                    resObj.data = playlist;

                } else {
                    resObj.code = 404 ;
                    resObj.message = "获取API出现问题";
                    console.err('Get data error!');
                }

                res.send( resObj );

            });
    } else {
        resObj.code = 404 ;
        resObj.message = "参数异常";
        res.send( resObj );
    }




});


// 网易云音乐根据歌单ID获得歌单所有歌曲的接口
app.get('/song_list/:playlistId', function(req, res){

    // 获得歌单ID
    var playlistId = req.params.playlistId;
    // 定义请求 url
    var requestUrl = 'http://music.163.com/playlist?id=' + playlistId;
    // 定义返回对象
    var resObj = {
        code: 200,
        message: "加载成功",
        data: {}
    };

    if (checkId(playlistId)) {
        request.get(requestUrl)
            .end(function(err, _response){

                if (!err) {

                    // 成功返回 HTML
                    var $ = cheerio.load(_response.text,{decodeEntities: false});
                    // 获得歌单 dom
                    var dom = $('#m-playlist');

                    resObj.data = JSON.parse( dom.find('#song-list-pre-cache').find('textarea').html() );

                } else {
                    resObj.code = 404 ;
                    resObj.message = "获取API出现问题";
                    console.err('Get data error!');
                }

                res.send( resObj );

            });
    } else {
        resObj.code = 404 ;
        resObj.message = "参数异常";
        res.send( resObj );
    }


});

// 获得网易云音乐主页banner
app.get('/index_banner', function(req, res){

    var requestUrl = 'http://music.163.com/discover';
    // 定义返回对象
    var resObj = {
        code: 200,
        message: "加载成功",
        data: {}
    };

    request.get(requestUrl)
        .end(function(err, _response){

            if (!err) {

                // 成功返回 HTML
                var $ = cheerio.load(_response.text,{decodeEntities: false});
                // 获得歌单 dom
                var bannerScript = $('script').eq(2);
                var bannerString = bannerScript.html().replace(/(^\s+)|(\s+$)/g,"").replace(/[\r\n]/g, "");
                bannerString = bannerString.substr(bannerString.indexOf("["), bannerString.length - 2);
                bannerString = eval(bannerString);
                resObj.data = bannerString;

            } else {
                resObj.code = 404 ;
                resObj.message = "获取API出现问题";
                console.err('Get data error!');
            }

            res.send( resObj );

        });

});


var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
var server = app.listen(port, host, function(){
    var port = server.address().port;
    console.log('WangyiyunAPI Server listening at http://' + host + ':' + port);
});


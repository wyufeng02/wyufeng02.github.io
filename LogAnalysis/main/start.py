#!/usr/bin/env python
# -*- coding:utf-8 -*-
#-Author-Lian

import time,datetime
import re

LOG_PATH="/data/nginx/logs/access.log"    #日志文件
HTML_PATH="../html/index.html"      #生成数据html文件
TABLE_TMP="../template/table_tmp"       #表格框架格式
TIMES_PRE=300       #刷新频率 单位秒

def handle():
    date_time = datetime.datetime.now()
    current_date = str(date_time).split(" ")[0]         #获取当前日期 年-月-日
    create_table(current_date)                      #创建信息表单

    last_site = 0          #上一次文件读到的位置
    while True:
        page_view = 0             #页面访问量
        succed_visit = 0          # 200状态码
        reject_visit = 0             # 被拒绝的访问503状态码
        unique_ip = set([])          # 独立IP
        unique_visitor= set([])       # 独立访客

        date_time = datetime.datetime.now()  # 生成时间日期
        date = str(date_time).split(" ")[0]  # 截取当前日期 年-月-日
        if date != current_date:  # 如果第二天，光标位置重新设置到文件首部
            current_date = date     # 更新current_date 值
            last_site = 0
            create_table(current_date)  # 创建信息表单

        current_time = str(date_time).split(".")[0]  # 日期 年-月-日-时-分-秒

        with open(LOG_PATH,"r") as file:
            print("---------",current_date,last_site)
            file.seek(last_site)
            logs = file.readlines()
            last_site = file.tell()          # 更新光标位置
            for line in logs:
                page_view += 1                       # 页面访问量+1
                obj_sd=re.search("- 200",line)      # 匹配200状态码+1
                if obj_sd:
                    succed_visit +=1
                obj_rt = re.search("- 503", line)   # 匹配503状态码+1
                if obj_rt:
                    reject_visit +=1

                obj_ip = re.match("\d+\.\d+\.\d+\.\d+",line)    # 匹配独立IP
                unique_ip.add(obj_ip.group())        # 添加集合，自动去重

                obj_uv = re.search("User_Cookie:...*", line)  # 匹配独立访客
                if obj_uv:                                     # 去空
                    unique_visitor.add(obj_uv.group())  # 添加集合，自动去重

            upload_data(current_time,page_view,succed_visit,reject_visit,len(unique_ip),len(unique_visitor))           #html文件内添加统计数据
            time.sleep(TIMES_PRE)

def upload_data(current_time,page_view,succed_visit,reject_visit,unique_ip,unique_visitor):
    with open(HTML_PATH, "r+",encoding="utf-8") as file:
        list = file.readlines()

        list.insert(-6,"<tr>\n")
        list.insert(-6, "<td>%s</td>\n"%current_time)     #时间
        list.insert(-6, "<td>%s</td>\n"%page_view)                   #页面访问量
        list.insert(-6, "<td>%s</td>\n" % succed_visit)  # 200访问
        list.insert(-6, "<td>%s</td>\n" % reject_visit)  # 503访问
        list.insert(-6, "<td>%s</td>\n" % unique_ip)    # 独立IP数
        list.insert(-6, "<td>%s</td>\n" % unique_visitor)  # 独立访客数
        list.insert(-6,"</tr>\n")

        file.seek(0)            #文件清空
        file.truncate(0)
        for line in list:       #新数据写入文件
            file.write(line)

def create_table(current_date):                           #创建信息表单
    with open(HTML_PATH, "r+", encoding="utf-8") as file:
        list = file.readlines()

        with open(TABLE_TMP, "r", encoding="utf-8") as table_tmp:
            for line in table_tmp:
                if "日期" in line:
                    line = line.replace("日期","日期:%s"%current_date)
                list.insert(-4, line)  # 创建新的表单

        file.seek(0)            #文件清空
        file.truncate(0)
        for line in list:       #新数据写入文件
            file.write(line)

if __name__ == '__main__':
    handle()
